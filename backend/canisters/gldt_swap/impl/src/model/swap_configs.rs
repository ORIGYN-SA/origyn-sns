use candid::{Nat, Principal};
use gldt_swap_common::general_error::GeneralError;
use gldt_swap_common::nft::Nft;
use gldt_swap_common::swap_canister_config::{
    FractionalizationConfig, GeneralFractionalizationConfig, SwapCanisterConfig,
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use tracing::error;

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct SwapConfigs {
    pub configs: Vec<SwapCanisterConfig>,
}

impl SwapConfigs {
    pub fn new() -> Self {
        Self {
            configs: Vec::new(),
        }
    }

    pub fn from_vec(configs: Vec<SwapCanisterConfig>) -> Self {
        Self { configs }
    }

    pub fn find_by_canister_id(
        &self,
        canister_id: &Principal,
    ) -> Result<&SwapCanisterConfig, GeneralError> {
        self.configs
            .iter()
            .find(|cfg| cfg.icrc7_canister_id == *canister_id)
            .ok_or_else(|| {
                GeneralError::ConfigNotFound(format!(
                    "No swap config found for canister {canister_id}"
                ))
            })
    }

    pub fn unique_ledger_ids(&self) -> HashSet<Principal> {
        self.configs
            .iter()
            .filter_map(|cfg| cfg.fractionalization_config.get_ledger_id().ok())
            .collect()
    }

    pub fn get_valid_nft_canisters(&self) -> Vec<Principal> {
        self.configs
            .iter()
            .map(|config| config.icrc7_canister_id)
            .collect()
    }

    pub fn validate_nfts(&self, args: &HashSet<Nft>) -> Result<(), GeneralError> {
        let nft_canisters = self.get_valid_nft_canisters();

        if args
            .iter()
            .any(|nft| !nft_canisters.contains(&nft.canister_id))
        {
            error!("Invalid NFT canisters provided: {:?}", args);

            return Err(GeneralError::InvalidNftCanister(format!(
                "You may not specify an unknown GLD NFT canister. \
                 Check that all your intended swaps contain a valid NFT canister principal \
                 that match one of these: \n {nft_canisters:?}"
            )));
        }

        Ok(())
    }

    pub fn get_nft_equivalent(
        &self,
        nft: &Nft,
    ) -> Result<GeneralFractionalizationConfig, GeneralError> {
        let cfg = self.find_by_canister_id(&nft.canister_id)?;

        match &cfg.fractionalization_config {
            FractionalizationConfig::General(gen_cfg) => Ok(gen_cfg.clone()),
            FractionalizationConfig::Custom(custom_cfg) => custom_cfg
                .per_token_config
                .get(&nft.id)
                .cloned()
                .ok_or_else(|| {
                    GeneralError::ConfigNotFound(format!(
                        "No fractionalization config found for NFT {} in canister {}",
                        nft.id, nft.canister_id
                    ))
                }),
        }
    }

    /// What `nfts` are worth, added up per ledger. Each NFT is valued by
    /// [`Self::get_nft_equivalent`], as its swap records it, so the checks, the consent message,
    /// the mint and the supply balancer all value an NFT the same way.
    pub fn token_equivalent<'a>(
        &self,
        nfts: impl IntoIterator<Item = &'a Nft>,
    ) -> Result<HashMap<Principal, Nat>, GeneralError> {
        let mut totals: HashMap<Principal, Nat> = HashMap::new();
        for nft in nfts {
            let value = self.get_nft_equivalent(nft)?;
            *totals
                .entry(value.ledger_id)
                .or_insert_with(|| Nat::from(0u8)) += Nat::from(value.division);
        }
        Ok(totals)
    }

    pub fn get_token_ledger_for_nft(
        &self,
        nft_canister_id: &Principal,
    ) -> Result<Principal, GeneralError> {
        let cfg = self
            .configs
            .iter()
            .find(|cfg| cfg.icrc7_canister_id == *nft_canister_id)
            .ok_or_else(|| {
                GeneralError::ConfigNotFound(format!(
                    "No swap config found for NFT canister {}",
                    nft_canister_id
                ))
            })?;

        // Propagate the Result from get_ledger_id
        cfg.fractionalization_config.get_ledger_id().map_err(|_| {
            GeneralError::ConfigNotFound(format!(
                "No ledger associated with NFT canister {}",
                nft_canister_id
            ))
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use gldt_swap_common::swap_canister_config::CustomFractionalizationConfig;
    use std::collections::BTreeMap;

    fn principal(n: u8) -> Principal {
        Principal::from_slice(&[n; 10])
    }

    fn nft(collection: u8, id: u64) -> Nft {
        Nft {
            canister_id: principal(collection),
            id: Nat::from(id),
        }
    }

    fn value(division: u64, ledger: u8) -> GeneralFractionalizationConfig {
        GeneralFractionalizationConfig {
            division,
            swap_fee: Nat::from(0u8),
            ledger_id: principal(ledger),
        }
    }

    #[test]
    fn token_equivalent_values_each_nft_as_its_swap_records_it() {
        // collection 1 is uniform; collection 2 values each token on its own, one of them on a
        // second ledger
        let configs = SwapConfigs::from_vec(vec![
            SwapCanisterConfig {
                icrc7_canister_id: principal(1),
                fractionalization_config: FractionalizationConfig::General(value(10, 8)),
            },
            SwapCanisterConfig {
                icrc7_canister_id: principal(2),
                fractionalization_config: FractionalizationConfig::Custom(
                    CustomFractionalizationConfig {
                        per_token_config: BTreeMap::from([
                            (Nat::from(1u8), value(100, 8)),
                            (Nat::from(2u8), value(1_000, 9)),
                        ]),
                    },
                ),
            },
        ]);
        let nfts = [nft(1, 1), nft(1, 2), nft(2, 1), nft(2, 2)];
        let totals = configs.token_equivalent(&nfts).unwrap();
        assert_eq!(
            totals,
            HashMap::from([
                (principal(8), Nat::from(120u8)),
                (principal(9), Nat::from(1_000u16)),
            ])
        );
        // the same as the swaps of these NFTs record, NFT by NFT
        for nft in &nfts {
            let recorded = configs.get_nft_equivalent(nft).unwrap();
            assert_eq!(
                configs.token_equivalent([nft]).unwrap(),
                HashMap::from([(recorded.ledger_id, Nat::from(recorded.division))])
            );
        }
        assert_eq!(configs.token_equivalent([]).unwrap(), HashMap::new());
        // an unknown collection or token
        assert!(matches!(
            configs.token_equivalent(&[nft(3, 1)]),
            Err(GeneralError::ConfigNotFound(_))
        ));
        assert!(matches!(
            configs.token_equivalent(&[nft(2, 3)]),
            Err(GeneralError::ConfigNotFound(_))
        ));
    }
}
