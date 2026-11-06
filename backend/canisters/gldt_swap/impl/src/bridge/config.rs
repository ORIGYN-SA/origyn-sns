//! Bridge config: validation and the init or upgrade argument.
//!
//! The config is set only by init and upgrade arguments, so an SNS upgrade
//! proposal is the only way to change it.

use crate::bridge::evm::address::parse_address;
use crate::bridge::state::BridgeState;
pub use gldt_swap_common::bridge::{
    BridgeConfig, BridgeUpgrade, ChainConfig, ChainReset, EvmChain, EvmProvider,
};
use std::collections::BTreeSet;

pub const PROVIDERS_PER_CHAIN: usize = 2;
pub const MAX_WINDOW_BLOCKS: u64 = 500;
pub const MAX_LOG_BATCH_SIZE: u32 = 50;
pub const MAX_ADMIN_ACTION_VALIDITY_SECS: u64 = 30 * 24 * 60 * 60;

pub fn validate_config(cfg: &BridgeConfig) -> Result<(), String> {
    if cfg.ecdsa_key_name.trim().is_empty() {
        return Err("ecdsa_key_name is empty".to_string());
    }
    if cfg.admin_action_validity_secs == 0 {
        return Err("admin_action_validity_secs must be above 0".to_string());
    }
    if cfg.admin_action_validity_secs > cfg.admin_action_max_validity_secs {
        return Err(format!(
            "admin_action_validity_secs {} is above admin_action_max_validity_secs {}",
            cfg.admin_action_validity_secs, cfg.admin_action_max_validity_secs
        ));
    }
    if cfg.admin_action_max_validity_secs > MAX_ADMIN_ACTION_VALIDITY_SECS {
        return Err(format!(
            "admin_action_max_validity_secs {} is above 30 days ({MAX_ADMIN_ACTION_VALIDITY_SECS})",
            cfg.admin_action_max_validity_secs
        ));
    }

    let mut chains = BTreeSet::new();
    let mut chain_ids = BTreeSet::new();
    for chain in &cfg.chains {
        if !chains.insert(chain.chain) {
            return Err(format!(
                "chain {:?} is configured more than once",
                chain.chain
            ));
        }
        if !chain_ids.insert(chain.chain_id) {
            return Err(format!(
                "chain id {} is configured more than once",
                chain.chain_id
            ));
        }
        validate_chain(chain).map_err(|e| format!("{:?}: {e}", chain.chain))?;
    }
    Ok(())
}

fn validate_chain(chain: &ChainConfig) -> Result<(), String> {
    if chain.chain_id == 0 {
        return Err("chain_id must be above 0".to_string());
    }
    if chain.lz_eid == 0 {
        return Err("lz_eid must be above 0".to_string());
    }
    for (field, text) in [("token", &chain.token), ("lz_endpoint", &chain.lz_endpoint)] {
        let address = parse_address(text).map_err(|e| format!("{field}: {e}"))?;
        if address == [0u8; 20] {
            return Err(format!("{field} is the zero address"));
        }
    }
    if chain.confirmations == 0 {
        return Err("confirmations must be above 0".to_string());
    }
    if !chain.head_rpc_url.starts_with("https://") {
        return Err(format!(
            "head_rpc_url {:?} is not https",
            chain.head_rpc_url
        ));
    }
    let distinct: BTreeSet<_> = chain.providers.iter().collect();
    if chain.providers.len() != PROVIDERS_PER_CHAIN || distinct.len() != PROVIDERS_PER_CHAIN {
        return Err(format!(
            "providers must be exactly {PROVIDERS_PER_CHAIN} distinct providers, got {:?}",
            chain.providers
        ));
    }
    if chain.chain == EvmChain::Base && chain.providers.contains(&EvmProvider::Cloudflare) {
        return Err("Cloudflare is not an EVM RPC provider for Base".to_string());
    }
    if chain.scrape_interval_secs == 0 {
        return Err("scrape_interval_secs must be above 0".to_string());
    }
    if chain.max_window_blocks == 0 || chain.max_window_blocks > MAX_WINDOW_BLOCKS {
        return Err(format!(
            "max_window_blocks {} is not in 1..={MAX_WINDOW_BLOCKS}",
            chain.max_window_blocks
        ));
    }
    if chain.log_batch_size == 0 || chain.log_batch_size > MAX_LOG_BATCH_SIZE {
        return Err(format!(
            "log_batch_size {} is not in 1..={MAX_LOG_BATCH_SIZE}",
            chain.log_batch_size
        ));
    }
    Ok(())
}

/// Applies an init or upgrade argument. On `Err` nothing changes.
///
/// - A new config replaces the old one. A chain whose deployment `(chain_id, token)`
///   is new gets a fresh `ChainState`; the state of earlier deployments is kept.
/// - A new `ecdsa_key_name` drops both loaded signers, so they are reloaded from the new key.
/// - Each `ChainReset` applies to the chain's current deployment, only if that chain is
///   stopped. It sets the cursor and clears the open window, the stop reason and the failed
///   ticks. A chain stopped at its first tick has no start block, so it runs the first tick again.
pub fn apply_bridge_upgrade(state: &mut BridgeState, up: BridgeUpgrade) -> Result<(), String> {
    let mut next = state.clone();

    if let Some(cfg) = up.config {
        validate_config(&cfg)?;
        let key_changed = next
            .config
            .as_ref()
            .is_none_or(|old| old.ecdsa_key_name != cfg.ecdsa_key_name);
        if key_changed {
            next.claims_signer = None;
            next.admin_signer = None;
        }
        next.config = Some(cfg);
        let configured: Vec<EvmChain> = next
            .config
            .iter()
            .flat_map(|c| c.chains.iter().map(|chain| chain.chain))
            .collect();
        for chain in configured {
            let deployment = next
                .deployment(chain)
                .ok_or_else(|| format!("{chain:?}: token address does not parse"))?;
            next.chains.entry(deployment).or_default();
        }
    }

    for reset in up.chain_resets {
        let chain = next
            .chain_state_mut(reset.chain)
            .ok_or_else(|| format!("chain reset: {:?} is not configured", reset.chain))?;
        if chain.stopped.is_none() {
            return Err(format!(
                "chain reset: {:?} is not stopped; only a stopped chain can be reset",
                reset.chain
            ));
        }
        chain.last_scraped_block = reset.last_scraped_block;
        chain.next_burn_id = reset.next_burn_id;
        chain.window = None;
        chain.stopped = None;
        chain.failed_ticks = 0;
    }

    *state = next;
    Ok(())
}

/// Configs for unit tests, shared by the bridge modules.
#[cfg(test)]
pub(crate) mod test_fixtures {
    use super::*;
    use candid::Principal;

    pub fn chain_config(chain: EvmChain) -> ChainConfig {
        let (chain_id, lz_eid, confirmations, head_rpc_url) = match chain {
            EvmChain::Ethereum => (1, 30101, 3, "https://ethereum-rpc.publicnode.com"),
            EvmChain::Base => (8453, 30184, 12, "https://base-rpc.publicnode.com"),
        };
        ChainConfig {
            chain,
            chain_id,
            lz_eid,
            token: "0x00000000000000000000000000000000000B1D6E".to_string(),
            lz_endpoint: "0x1a44076050125825900e736c501f859c50fE728c".to_string(),
            confirmations,
            head_rpc_url: head_rpc_url.to_string(),
            providers: vec![EvmProvider::Alchemy, EvmProvider::Ankr],
            scrape_interval_secs: 180,
            max_window_blocks: 500,
            log_batch_size: 50,
        }
    }

    pub fn bridge_config() -> BridgeConfig {
        BridgeConfig {
            sns_governance: Principal::from_slice(&[0x5a; 10]),
            evm_rpc_canister: Principal::from_text("7hfb6-caaaa-aaaar-qadga-cai").unwrap(),
            ecdsa_key_name: "key_1".to_string(),
            admin_action_validity_secs: 7 * 24 * 60 * 60,
            admin_action_max_validity_secs: MAX_ADMIN_ACTION_VALIDITY_SECS,
            chains: vec![
                chain_config(EvmChain::Ethereum),
                chain_config(EvmChain::Base),
            ],
        }
    }

    /// A `BridgeState` with `bridge_config()` applied.
    pub fn configured_state() -> BridgeState {
        let mut state = BridgeState::default();
        apply_bridge_upgrade(
            &mut state,
            BridgeUpgrade {
                config: Some(bridge_config()),
                chain_resets: vec![],
            },
        )
        .unwrap();
        state
    }
}

#[cfg(test)]
mod tests {
    use super::test_fixtures::{bridge_config, chain_config, configured_state};
    use super::*;
    use crate::bridge::state::{BridgeState, ChainState, EvmSigner, Window};
    use alloy_primitives::U256;

    fn upgrade(config: Option<BridgeConfig>, chain_resets: Vec<ChainReset>) -> BridgeUpgrade {
        BridgeUpgrade {
            config,
            chain_resets,
        }
    }

    fn rejects(cfg: BridgeConfig, needle: &str) {
        match validate_config(&cfg) {
            Ok(()) => panic!("config was accepted, expected an error with {needle:?}"),
            Err(e) => assert!(
                e.contains(needle),
                "error {e:?} does not mention {needle:?}"
            ),
        }
    }

    #[test]
    fn valid_config_is_accepted() {
        assert_eq!(validate_config(&bridge_config()), Ok(()));
    }

    #[test]
    fn config_rejects_one_provider_zero_confirmations_bad_address_window_over_500() {
        let mut cfg = bridge_config();
        cfg.chains[0].providers = vec![EvmProvider::Alchemy];
        rejects(cfg, "providers");

        let mut cfg = bridge_config();
        cfg.chains[0].providers = vec![EvmProvider::Ankr, EvmProvider::Ankr];
        rejects(cfg, "providers");

        let mut cfg = bridge_config();
        cfg.chains[0].providers = vec![
            EvmProvider::Alchemy,
            EvmProvider::Ankr,
            EvmProvider::PublicNode,
        ];
        rejects(cfg, "providers");

        let mut cfg = bridge_config();
        cfg.chains[1].providers = vec![EvmProvider::Alchemy, EvmProvider::Cloudflare];
        rejects(cfg, "Cloudflare");

        let mut cfg = bridge_config();
        cfg.chains[0].confirmations = 0;
        rejects(cfg, "confirmations");

        let mut cfg = bridge_config();
        cfg.chains[0].token = "0x1234".to_string();
        rejects(cfg, "token");

        let mut cfg = bridge_config();
        cfg.chains[0].token = "00000000000000000000000000000000000B1D6E00".to_string();
        rejects(cfg, "token");

        let mut cfg = bridge_config();
        cfg.chains[0].token = format!("0x{}", "0".repeat(40));
        rejects(cfg, "token");

        let mut cfg = bridge_config();
        // one letter of a checksummed address flipped to lower case
        cfg.chains[0].token = "0x0a82D20142d067C8AF32f48664bDDfb65EcAE507".to_string();
        rejects(cfg, "token");

        let mut cfg = bridge_config();
        cfg.chains[1].lz_endpoint = "0xzz44076050125825900e736c501f859c50fE728c".to_string();
        rejects(cfg, "lz_endpoint");

        let mut cfg = bridge_config();
        cfg.chains[0].max_window_blocks = 501;
        rejects(cfg, "max_window_blocks");

        let mut cfg = bridge_config();
        cfg.chains[0].max_window_blocks = 0;
        rejects(cfg, "max_window_blocks");

        let mut cfg = bridge_config();
        cfg.chains[0].log_batch_size = 0;
        rejects(cfg, "log_batch_size");

        let mut cfg = bridge_config();
        cfg.chains[0].log_batch_size = 51;
        rejects(cfg, "log_batch_size");

        let mut cfg = bridge_config();
        cfg.chains[0].scrape_interval_secs = 0;
        rejects(cfg, "scrape_interval_secs");

        let mut cfg = bridge_config();
        cfg.chains[0].head_rpc_url = "http://ethereum-rpc.publicnode.com".to_string();
        rejects(cfg, "head_rpc_url");

        let mut cfg = bridge_config();
        cfg.chains[1] = chain_config(EvmChain::Ethereum);
        rejects(cfg, "more than once");

        let mut cfg = bridge_config();
        cfg.chains[1].chain_id = 1;
        rejects(cfg, "more than once");

        let mut cfg = bridge_config();
        cfg.admin_action_validity_secs = cfg.admin_action_max_validity_secs + 1;
        rejects(cfg, "admin_action_validity_secs");

        let mut cfg = bridge_config();
        cfg.admin_action_validity_secs = 0;
        rejects(cfg, "admin_action_validity_secs");

        let mut cfg = bridge_config();
        cfg.admin_action_max_validity_secs = MAX_ADMIN_ACTION_VALIDITY_SECS + 1;
        rejects(cfg, "admin_action_max_validity_secs");

        let mut cfg = bridge_config();
        cfg.ecdsa_key_name = String::new();
        rejects(cfg, "ecdsa_key_name");
    }

    #[test]
    fn checksummed_lower_and_upper_case_addresses_are_accepted() {
        let mut cfg = bridge_config();
        cfg.chains[0].token = "0x0A82D20142d067C8AF32f48664bDDfb65EcAE507".to_string();
        cfg.chains[1].token = "0x0a82d20142d067c8af32f48664bddfb65ecae507".to_string();
        assert_eq!(validate_config(&cfg), Ok(()));
        cfg.chains[1].token = "0x0A82D20142D067C8AF32F48664BDDFB65ECAE507".to_string();
        assert_eq!(validate_config(&cfg), Ok(()));
    }

    #[test]
    fn new_token_address_creates_fresh_chain_state() {
        let mut state = BridgeState::default();
        apply_bridge_upgrade(&mut state, upgrade(Some(bridge_config()), vec![])).unwrap();
        assert_eq!(state.chains.len(), 2);

        let eth = state.deployment(EvmChain::Ethereum).unwrap();
        assert_eq!(eth.0, 1);
        {
            let chain = state.chains.get_mut(&eth).unwrap();
            chain.start_block = Some(100);
            chain.last_scraped_block = 150;
            chain.next_burn_id = 4;
        }

        // the same config again keeps the progress
        apply_bridge_upgrade(&mut state, upgrade(Some(bridge_config()), vec![])).unwrap();
        assert_eq!(state.chains.len(), 2);
        assert_eq!(state.chains[&eth].start_block, Some(100));

        // a new token on Ethereum starts from scratch and keeps the old record
        let mut cfg = bridge_config();
        cfg.chains[0].token = "0x00000000000000000000000000000000000E7E02".to_string();
        apply_bridge_upgrade(&mut state, upgrade(Some(cfg), vec![])).unwrap();
        assert_eq!(state.chains.len(), 3);
        let new_eth = state.deployment(EvmChain::Ethereum).unwrap();
        assert_ne!(new_eth, eth);
        assert_eq!(new_eth.0, 1);
        assert_eq!(state.chains[&new_eth], ChainState::default());
        assert_eq!(state.chains[&eth].next_burn_id, 4);
        assert_eq!(
            state.chain_state(EvmChain::Ethereum),
            Some(&ChainState::default())
        );
    }

    #[test]
    fn chain_reset_only_applies_to_stopped_chain() {
        let mut state = configured_state();
        let base = state.deployment(EvmChain::Base).unwrap();
        {
            let chain = state.chains.get_mut(&base).unwrap();
            chain.start_block = Some(1_000);
            chain.last_scraped_block = 2_000;
            chain.next_burn_id = 8;
            chain.window = Some(Window {
                to_block: 2_400,
                end_burn_id: 20,
                total_supply: U256::from(5u8),
            });
            chain.failed_ticks = 3;
        }
        let reset = ChainReset {
            chain: EvmChain::Base,
            last_scraped_block: 1_500,
            next_burn_id: 6,
        };

        // a running chain refuses the reset and nothing changes
        let before = state.clone();
        let err = apply_bridge_upgrade(&mut state, upgrade(None, vec![reset.clone()])).unwrap_err();
        assert!(err.contains("not stopped"), "{err}");
        assert_eq!(state, before);

        // a stopped chain takes it
        state.chains.get_mut(&base).unwrap().stopped = Some("deep reorg".to_string());
        apply_bridge_upgrade(&mut state, upgrade(None, vec![reset.clone()])).unwrap();
        let chain = &state.chains[&base];
        assert_eq!(chain.last_scraped_block, 1_500);
        assert_eq!(chain.next_burn_id, 6);
        assert_eq!(chain.window, None);
        assert_eq!(chain.stopped, None);
        assert_eq!(chain.failed_ticks, 0);
        assert_eq!(chain.start_block, Some(1_000));

        // a second reset in a row is refused, because the chain runs again
        assert!(apply_bridge_upgrade(&mut state, upgrade(None, vec![reset])).is_err());
    }

    #[test]
    fn reset_of_unconfigured_chain_is_rejected() {
        let mut state = BridgeState::default();
        let reset = ChainReset {
            chain: EvmChain::Base,
            last_scraped_block: 1,
            next_burn_id: 0,
        };
        assert!(apply_bridge_upgrade(&mut state, upgrade(None, vec![reset.clone()])).is_err());

        let mut cfg = bridge_config();
        cfg.chains.truncate(1);
        assert!(apply_bridge_upgrade(&mut state, upgrade(Some(cfg), vec![reset])).is_err());
        assert_eq!(state, BridgeState::default());
    }

    #[test]
    fn invalid_upgrade_changes_nothing() {
        let mut state = BridgeState::default();
        apply_bridge_upgrade(&mut state, upgrade(Some(bridge_config()), vec![])).unwrap();
        let before = state.clone();

        let mut cfg = bridge_config();
        cfg.chains[0].confirmations = 0;
        assert!(apply_bridge_upgrade(&mut state, upgrade(Some(cfg), vec![])).is_err());
        assert_eq!(state, before);

        // no config keeps the current one
        apply_bridge_upgrade(&mut state, upgrade(None, vec![])).unwrap();
        assert_eq!(state, before);
    }

    #[test]
    fn key_name_change_clears_signers() {
        let signer = EvmSigner {
            public_key: vec![2; 33],
            address: [1; 20],
        };
        let mut state = BridgeState::default();
        apply_bridge_upgrade(&mut state, upgrade(Some(bridge_config()), vec![])).unwrap();
        state.claims_signer = Some(signer.clone());
        state.admin_signer = Some(signer.clone());

        // same key name: signers stay
        apply_bridge_upgrade(&mut state, upgrade(Some(bridge_config()), vec![])).unwrap();
        assert_eq!(state.claims_signer, Some(signer.clone()));

        // another key name: both are dropped and reloaded later
        let mut cfg = bridge_config();
        cfg.ecdsa_key_name = "test_key_1".to_string();
        apply_bridge_upgrade(&mut state, upgrade(Some(cfg), vec![])).unwrap();
        assert_eq!(state.claims_signer, None);
        assert_eq!(state.admin_signer, None);
    }
}
