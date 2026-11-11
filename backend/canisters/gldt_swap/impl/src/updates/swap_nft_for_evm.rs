use crate::bridge::gldt_ledger;
use crate::bridge::outbound::{check_outbound, record_nft_backed_outbound, sign_new_transfer};
use crate::guards::{reject_anonymous_caller, BridgeCallerGuard};
use crate::model::swap_configs::SwapConfigs;
use crate::state::{read_state, RuntimeState};
use crate::updates::swap_nft_for_tokens::{forward_swap, ForwardPayout, Issued};
use candid::{Nat, Principal};
pub use gldt_swap_api_canister::swap_nft_for_evm::{
    Args as SwapNftForEvmArgs, Response as SwapNftForEvmResponse,
};
use gldt_swap_api_canister::swap_nft_for_evm::{SwapNftForEvmError, SwapNftForEvmOk};
use gldt_swap_common::bridge::{BridgeError, EvmChain, OutboundTransfer};
use gldt_swap_common::general_error::GeneralError;
use gldt_swap_common::nft::Nft;
use gldt_swap_common::swap::{SwapIndex, SwapInfo};
use ic_cdk::api::msg_caller;
use ic_cdk::update;
use std::collections::{HashMap, HashSet};
use utils::env::Environment;

/// Swaps the caller's gold NFTs for GLDT on Ethereum or Base in one call. The NFTs move to
/// gldt_swap and back the GLDT: nothing is minted or burned on ICP. The reply carries the
/// signed claim voucher, which anyone may submit with `claimFromIcp` on the token. The caller
/// first approves gldt_swap for each NFT.
#[update(guard = "reject_anonymous_caller")]
pub async fn swap_nft_for_evm(args: SwapNftForEvmArgs) -> SwapNftForEvmResponse {
    swap_nft_for_evm_impl(args).await
}

async fn swap_nft_for_evm_impl(args: SwapNftForEvmArgs) -> SwapNftForEvmResponse {
    let _span = tracing::info_span!("SWAP_NFT_FOR_EVM").entered();

    let caller = msg_caller();
    // held for the whole call, also across a trap
    let _caller_guard = BridgeCallerGuard::new(caller)?;

    let mut payout = EvmPayout {
        chain: args.chain,
        recipient: args.recipient,
    };
    let (swap_ids, transfer) = forward_swap(caller, args.nfts, &mut payout).await?;
    let transfer = sign_new_transfer(transfer).await;
    Ok(SwapNftForEvmOk { swap_ids, transfer })
}

/// `swap_nft_for_evm`: the GLDT is issued as a claim voucher on `chain`, backed by the NFTs.
struct EvmPayout {
    chain: EvmChain,
    /// As the caller passed it, then in EIP-55 form once checked.
    recipient: String,
}

impl ForwardPayout for EvmPayout {
    type Error = SwapNftForEvmError;
    type Receipt = OutboundTransfer;

    fn check(&mut self, nfts: &HashSet<Nft>) -> Result<(), Self::Error> {
        self.recipient = read_state(|s| check_nft_to_evm(s, nfts, self.chain, &self.recipient))?;
        Ok(())
    }

    async fn issue(
        &mut self,
        _caller: Principal,
        _swaps: &HashMap<SwapIndex, SwapInfo>,
        moved: Vec<SwapIndex>,
    ) -> Result<Issued, Self::Error> {
        // no call: `record` stores the transfer when the swaps complete
        Ok(Issued {
            issued: moved,
            failed: Vec::new(),
        })
    }

    fn record(
        &mut self,
        state: &mut RuntimeState,
        caller: Principal,
        swaps: &HashMap<SwapIndex, SwapInfo>,
        issued: &[SwapIndex],
    ) -> OutboundTransfer {
        // only the NFTs that moved count, at the value their swaps recorded
        let amount: u128 = issued
            .iter()
            .filter_map(|id| swaps.get(id))
            .map(|swap| u128::from(swap.tokens_amount.division))
            .sum();
        let now = state.env.now_nanos();
        record_nft_backed_outbound(
            &mut state.data.bridge,
            caller,
            self.chain,
            self.recipient.clone(),
            amount,
            now,
        )
    }
}

/// The checks `swap_nft_for_evm` makes beyond the swap's: the swap configs name the one GLDT
/// ledger the bridge counts, and [`check_outbound`] passes for the GLDT value of all `nfts`.
/// Returns the recipient in EIP-55 form.
fn check_nft_to_evm(
    state: &RuntimeState,
    nfts: &HashSet<Nft>,
    chain: EvmChain,
    recipient: &str,
) -> Result<String, SwapNftForEvmError> {
    gldt_ledger(&state.data.swap_configs).map_err(BridgeError::NotReady)?;
    let amount = nfts_value(&state.data.swap_configs, nfts)?;
    let (recipient, _) = check_outbound(&state.data.bridge, chain, recipient, &amount)?;
    Ok(recipient)
}

/// The GLDT value of `nfts` in e8s, as their swaps record it: [`SwapConfigs::token_equivalent`]
/// added up over the ledgers.
pub fn nfts_value(configs: &SwapConfigs, nfts: &HashSet<Nft>) -> Result<Nat, GeneralError> {
    Ok(configs
        .token_equivalent(nfts)?
        .into_values()
        .fold(Nat::from(0u8), |total, value| total + value))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::test_fixtures::configured_state;
    use crate::bridge::outbound::MAX_OUT_AMOUNT_E8S;
    use crate::bridge::stable::with_outbound;
    use crate::bridge::state::{BridgeState, EvmSigner};
    use crate::bridge::test_state::install;
    use gldt_swap_api_canister::swap_nft_for_tokens::SwapNftForTokensErrors;
    use gldt_swap_common::swap_canister_config::{
        CustomFractionalizationConfig, FractionalizationConfig, GeneralFractionalizationConfig,
        SwapCanisterConfig,
    };
    use icrc_ledger_types::icrc2::transfer_from::TransferFromError;
    use std::collections::BTreeMap;

    const RECIPIENT: &str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    /// 1,000 GLDT, the value of a 1 kg bar.
    const KG: u64 = 100_000_000_000;

    fn gldt_ledger_id() -> Principal {
        Principal::from_slice(&[2; 10])
    }

    fn collection(n: u8) -> Principal {
        Principal::from_slice(&[n; 10])
    }

    fn nft(collection_id: u8, id: u64) -> Nft {
        Nft {
            id: Nat::from(id),
            canister_id: collection(collection_id),
        }
    }

    fn general(collection_id: u8, division: u64, ledger: Principal) -> SwapCanisterConfig {
        SwapCanisterConfig {
            icrc7_canister_id: collection(collection_id),
            fractionalization_config: FractionalizationConfig::General(
                GeneralFractionalizationConfig {
                    division,
                    swap_fee: Nat::from(100_000_000u64),
                    ledger_id: ledger,
                },
            ),
        }
    }

    /// Collection 1 holds 1 kg bars, collection 2 bars of `u64::MAX` e8s, and collection 3 only
    /// knows NFT 1, worth nothing.
    fn swap_configs() -> Vec<SwapCanisterConfig> {
        let ledger = gldt_ledger_id();
        let worthless = GeneralFractionalizationConfig {
            division: 0,
            swap_fee: Nat::from(0u8),
            ledger_id: ledger,
        };
        vec![
            general(1, KG, ledger),
            general(2, u64::MAX, ledger),
            SwapCanisterConfig {
                icrc7_canister_id: collection(3),
                fractionalization_config: FractionalizationConfig::Custom(
                    CustomFractionalizationConfig {
                        per_token_config: BTreeMap::from([(Nat::from(1u8), worthless)]),
                    },
                ),
            },
        ]
    }

    /// Configured, both signers loaded, and every chain open.
    fn ready_bridge() -> BridgeState {
        let mut bridge = configured_state();
        let signer = EvmSigner {
            public_key: vec![2; 33],
            address: [9; 20],
        };
        bridge.claims_signer = Some(signer.clone());
        bridge.admin_signer = Some(signer);
        for chain in [EvmChain::Ethereum, EvmChain::Base] {
            bridge.chain_state_mut(chain).unwrap().start_block = Some(100);
        }
        bridge
    }

    fn setup(bridge: BridgeState, configs: Vec<SwapCanisterConfig>) {
        let mut state = RuntimeState::default();
        state.data.bridge = bridge;
        state.data.swap_configs = SwapConfigs::from_vec(configs);
        install(state);
    }

    fn check(nfts: &[Nft], chain: EvmChain, recipient: &str) -> Result<String, SwapNftForEvmError> {
        let nfts: HashSet<Nft> = nfts.iter().cloned().collect();
        read_state(|s| check_nft_to_evm(s, &nfts, chain, recipient))
    }

    fn bridge_error(result: Result<String, SwapNftForEvmError>) -> BridgeError {
        match result {
            Err(SwapNftForEvmError::Bridge(e)) => e,
            other => panic!("expected a bridge error, got {other:?}"),
        }
    }

    /// No transfer, no counter and no swap moved.
    fn assert_nothing_changed() {
        read_state(|s| {
            let bridge = &s.data.bridge;
            assert_eq!(bridge.next_out_id, 0);
            assert_eq!(bridge.out_pending, 0);
            assert_eq!(bridge.bridged_out, 0);
            assert!(bridge.outbound_work.is_empty());
            assert!(s.data.swap_system.swaps.is_empty());
            assert_eq!(s.data.swap_system.swaps_started, 0);
        });
        assert_eq!(with_outbound(|m| m.len()), 0);
    }

    #[test]
    fn nft_values_add_up_from_the_swap_configs() {
        let configs = SwapConfigs::from_vec(swap_configs());
        let set = |nfts: &[Nft]| nfts.iter().cloned().collect::<HashSet<_>>();
        assert_eq!(nfts_value(&configs, &set(&[])), Ok(Nat::from(0u8)));
        assert_eq!(
            nfts_value(&configs, &set(&[nft(1, 1), nft(1, 2), nft(3, 1)])),
            Ok(Nat::from(2 * KG))
        );
        // no overflow
        assert_eq!(
            nfts_value(&configs, &set(&[nft(2, 1), nft(2, 2)])),
            Ok(Nat::from(u64::MAX) * Nat::from(2u8))
        );
        // an NFT the custom config does not know
        assert!(matches!(
            nfts_value(&configs, &set(&[nft(3, 2)])),
            Err(GeneralError::ConfigNotFound(_))
        ));
    }

    #[test]
    fn ready_bridge_accepts_and_gives_the_eip55_recipient() {
        setup(ready_bridge(), swap_configs());
        assert_eq!(
            check(
                &[nft(1, 1), nft(1, 2)],
                EvmChain::Ethereum,
                &RECIPIENT.to_lowercase()
            )
            .unwrap(),
            RECIPIENT
        );
        // the largest accepted amount
        assert_eq!(MAX_OUT_AMOUNT_E8S, u64::MAX);
        assert_eq!(
            check(&[nft(2, 1)], EvmChain::Base, RECIPIENT).unwrap(),
            RECIPIENT
        );
        assert_nothing_changed();
    }

    #[test]
    fn paused_out_rejects() {
        let mut bridge = ready_bridge();
        bridge.paused_out = true;
        // paused wins over not ready
        bridge.claims_signer = None;
        setup(bridge, swap_configs());
        assert_eq!(
            bridge_error(check(&[nft(1, 1)], EvmChain::Base, RECIPIENT)),
            BridgeError::Paused
        );
        assert_nothing_changed();

        // the inbound pause does not stop it
        let mut bridge = ready_bridge();
        bridge.paused_in = true;
        setup(bridge, swap_configs());
        assert!(check(&[nft(1, 1)], EvmChain::Base, RECIPIENT).is_ok());
    }

    #[test]
    fn not_ready_rejects() {
        let unconfigured = BridgeState {
            claims_signer: ready_bridge().claims_signer,
            ..BridgeState::default()
        };
        setup(unconfigured, swap_configs());
        assert!(matches!(
            bridge_error(check(&[nft(1, 1)], EvmChain::Base, RECIPIENT)),
            BridgeError::NotReady(m) if m.contains("not configured")
        ));
        assert_nothing_changed();

        let mut no_admin = ready_bridge();
        no_admin.admin_signer = None;
        setup(no_admin, swap_configs());
        assert!(matches!(
            bridge_error(check(&[nft(1, 1)], EvmChain::Base, RECIPIENT)),
            BridgeError::NotReady(m) if m.contains("signer")
        ));
        assert_nothing_changed();

        // Base has no start block yet, so neither chain takes transfers
        let mut base_closed = ready_bridge();
        base_closed
            .chain_state_mut(EvmChain::Base)
            .unwrap()
            .start_block = None;
        setup(base_closed, swap_configs());
        for chain in [EvmChain::Ethereum, EvmChain::Base] {
            assert!(matches!(
                bridge_error(check(&[nft(1, 1)], chain, RECIPIENT)),
                BridgeError::NotReady(m) if m.contains("start block")
            ));
        }
        assert_nothing_changed();

        // a stopped chain refuses, the other one keeps working
        let mut base_stopped = ready_bridge();
        base_stopped
            .chain_state_mut(EvmChain::Base)
            .unwrap()
            .stopped = Some("deep reorg".to_string());
        setup(base_stopped, swap_configs());
        assert!(matches!(
            bridge_error(check(&[nft(1, 1)], EvmChain::Base, RECIPIENT)),
            BridgeError::NotReady(m) if m.contains("deep reorg")
        ));
        assert!(check(&[nft(1, 1)], EvmChain::Ethereum, RECIPIENT).is_ok());
        assert_nothing_changed();

        // the bridge counts one GLDT ledger; swap configs that name two leave it not ready
        let mut two_ledgers = swap_configs();
        two_ledgers.push(general(4, KG, Principal::from_slice(&[8; 10])));
        setup(ready_bridge(), two_ledgers);
        assert!(matches!(
            bridge_error(check(&[nft(1, 1)], EvmChain::Base, RECIPIENT)),
            BridgeError::NotReady(m) if m.contains("2 ledgers")
        ));
        assert_nothing_changed();
    }

    #[test]
    fn unknown_chain_rejects() {
        let mut eth_only = ready_bridge();
        eth_only
            .config
            .as_mut()
            .unwrap()
            .chains
            .retain(|c| c.chain == EvmChain::Ethereum);
        setup(eth_only, swap_configs());
        assert_eq!(
            bridge_error(check(&[nft(1, 1)], EvmChain::Base, RECIPIENT)),
            BridgeError::UnknownChain
        );
        assert!(check(&[nft(1, 1)], EvmChain::Ethereum, RECIPIENT).is_ok());
        assert_nothing_changed();
    }

    #[test]
    fn zero_and_over_limit_amounts_reject() {
        setup(ready_bridge(), swap_configs());
        assert_eq!(
            bridge_error(check(&[nft(3, 1)], EvmChain::Base, RECIPIENT)),
            BridgeError::ZeroAmount
        );
        // two bars of u64::MAX e8s are above the largest amount the bridge accepts
        assert!(matches!(
            bridge_error(check(&[nft(2, 1), nft(2, 2)], EvmChain::Base, RECIPIENT)),
            BridgeError::Burn(TransferFromError::GenericError { message, .. })
                if message.contains("above the largest amount")
        ));
        // an NFT with no value in the config is a swap error, before any bridge check
        assert!(matches!(
            check(&[nft(3, 2)], EvmChain::Base, RECIPIENT),
            Err(SwapNftForEvmError::Swap(
                SwapNftForTokensErrors::GeneralError(GeneralError::ConfigNotFound(_))
            ))
        ));
        assert_nothing_changed();
    }

    #[test]
    fn bad_recipients_reject() {
        setup(ready_bridge(), swap_configs());
        let zero = format!("0x{}", "0".repeat(40));
        let nineteen_bytes = format!("0x{}", "ab".repeat(19));
        let no_prefix = RECIPIENT[2..].to_string();
        // one letter of the checksummed address flipped to lower case
        let bad_checksum = "0x70997970c51812dc3A010C7d01b50e0d17dc79C8".to_string();
        for bad in [zero, nineteen_bytes, no_prefix, bad_checksum, String::new()] {
            assert_eq!(
                bridge_error(check(&[nft(1, 1)], EvmChain::Base, &bad)),
                BridgeError::InvalidRecipient,
                "recipient {bad:?}"
            );
        }
        assert_nothing_changed();
    }

    #[test]
    fn evm_payout_records_only_the_moved_nfts() {
        setup(ready_bridge(), swap_configs());
        let mut payout = EvmPayout {
            chain: EvmChain::Ethereum,
            recipient: RECIPIENT.to_lowercase(),
        };
        let nfts: HashSet<Nft> = [nft(1, 1), nft(1, 2), nft(1, 3)].into_iter().collect();
        payout.check(&nfts).unwrap();
        assert_eq!(payout.recipient, RECIPIENT);

        let user = Principal::from_slice(&[7; 29]);
        let swaps: HashMap<SwapIndex, SwapInfo> = nfts
            .iter()
            .enumerate()
            .map(|(i, nft)| {
                let index = Nat::from(i);
                let tokens_amount =
                    read_state(|s| s.data.swap_configs.get_nft_equivalent(nft)).unwrap();
                let swap = SwapInfo::new(
                    index.clone(),
                    gldt_swap_common::swap::SwapType::Forward,
                    user.into(),
                    nft.clone(),
                    tokens_amount,
                );
                (index, swap)
            })
            .collect();
        // the NFT of swap 1 did not move
        let moved = vec![Nat::from(0u8), Nat::from(2u8)];
        let record = crate::state::mutate_state(|s| payout.record(s, user, &swaps, &moved));
        assert_eq!(record.amount, Nat::from(2 * KG));
        assert_eq!(record.recipient, RECIPIENT);
        assert_eq!(record.chain, EvmChain::Ethereum);
        assert_eq!(record.from, user.into());
        read_state(|s| {
            assert_eq!(s.data.bridge.bridged_out, u128::from(2 * KG));
            assert_eq!(s.data.bridge.out_pending, 0);
        });
    }
}
