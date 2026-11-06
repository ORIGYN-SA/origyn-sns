//! The GLDT bridge between ICP, Ethereum and Base.

pub mod config;
pub mod evm;
pub mod jobs;
pub mod outbound;
pub mod signer;
pub mod stable;
pub mod state;

use crate::model::swap_configs::SwapConfigs;
use crate::state::read_state;
use candid::Principal;
use std::time::Duration;

/// Starts the bridge timers after init and every upgrade (timers don't survive upgrades).
/// Does nothing while the bridge has no config.
pub fn start_jobs() {
    if read_state(|s| s.data.bridge.config.is_none()) {
        return;
    }
    ic_cdk_timers::set_timer(Duration::ZERO, signer::load_signers());
    jobs::start();
}

/// The GLDT ledger the bridge burns and mints on: the one ledger the swap configs name, the
/// same one the swaps and the supply balancer use (`6c7su-kiaaa-aaaar-qaira-cai` on mainnet).
/// An error when the swap configs name no ledger or more than one.
pub fn gldt_ledger(swap_configs: &SwapConfigs) -> Result<Principal, String> {
    let ledgers = swap_configs.unique_ledger_ids();
    let mut iter = ledgers.iter();
    match (iter.next(), iter.next()) {
        (Some(ledger), None) => Ok(*ledger),
        (None, _) => Err("no swap config names the GLDT ledger".to_string()),
        (Some(_), Some(_)) => Err(format!(
            "the swap configs name {} ledgers; the bridge needs exactly one GLDT ledger",
            ledgers.len()
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Nat;
    use gldt_swap_common::swap_canister_config::{
        FractionalizationConfig, GeneralFractionalizationConfig, SwapCanisterConfig,
    };

    fn swap_config(nft: u8, ledger: Principal) -> SwapCanisterConfig {
        SwapCanisterConfig {
            icrc7_canister_id: Principal::from_slice(&[nft; 10]),
            fractionalization_config: FractionalizationConfig::General(
                GeneralFractionalizationConfig {
                    division: 100_000_000_000,
                    swap_fee: Nat::from(100_000_000u64),
                    ledger_id: ledger,
                },
            ),
        }
    }

    #[test]
    fn gldt_ledger_is_the_one_ledger_in_the_swap_configs() {
        let gldt = Principal::from_text("6c7su-kiaaa-aaaar-qaira-cai").unwrap();
        let other = Principal::from_slice(&[9; 10]);

        assert!(gldt_ledger(&SwapConfigs::default()).is_err());
        assert_eq!(
            gldt_ledger(&SwapConfigs::from_vec(vec![swap_config(1, gldt)])),
            Ok(gldt)
        );
        // several NFT canisters on the same ledger
        assert_eq!(
            gldt_ledger(&SwapConfigs::from_vec(vec![
                swap_config(1, gldt),
                swap_config(2, gldt)
            ])),
            Ok(gldt)
        );
        let two = SwapConfigs::from_vec(vec![swap_config(1, gldt), swap_config(2, other)]);
        assert!(gldt_ledger(&two).unwrap_err().contains("2 ledgers"));
    }
}
