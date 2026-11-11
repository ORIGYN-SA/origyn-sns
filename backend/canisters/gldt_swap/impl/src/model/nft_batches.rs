use crate::state::read_state;
use candid::{Nat, Principal};
use futures::future::join_all;
use gldt_swap_common::general_error::GeneralError;
use gldt_swap_common::nft::Nft;
use icrc_ledger_types::icrc1::account::Account;
use origyn_nft_canister::icrc37_transfer_from::{
    TransferFromArg, TransferFromError, TransferFromResult,
};
use origyn_nft_canister::icrc7_transfer::TransferError;
use origyn_nft_canister::TransferArg;
use origyn_nft_canister_c2c_client::{icrc37_transfer_from, icrc7_owner_of, icrc7_transfer};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use tracing::{error, info};
use types::CanisterId;

/// The results of a batch NFT transfer: per collection, each requested NFT id with its own
/// result.
pub type NftTransferResults<E> = BTreeMap<Principal, Vec<(Nat, Result<(), E>)>>;

/// What a batch NFT transfer did with one NFT.
#[derive(Debug)]
pub enum NftTransferOutcome<'a, E> {
    /// The NFT moved.
    Moved,
    /// The NFT did not move, for this reason.
    Failed(&'a E),
    /// The results hold nothing for the NFT.
    NoEntry,
}

/// The outcome of `nft`'s own transfer in `results`. Only the entry with the NFT's id counts:
/// an error for another NFT of the same collection never decides this one.
pub fn nft_transfer_outcome<'a, E>(
    results: &'a NftTransferResults<E>,
    nft: &Nft,
) -> NftTransferOutcome<'a, E> {
    let entry = results
        .get(&nft.canister_id)
        .and_then(|entries| entries.iter().find(|(id, _)| *id == nft.id));
    match entry {
        Some((_, Ok(()))) => NftTransferOutcome::Moved,
        Some((_, Err(e))) => NftTransferOutcome::Failed(e),
        None => NftTransferOutcome::NoEntry,
    }
}

/// Pairs each of `nft_ids` with its result in `reply`, by position, as ICRC-7 and ICRC-37 answer
/// a batch. An `Err` reply (a call or batch-level error) fails every NFT of the call with that
/// error. A result the reply leaves out, or sends as `None`, fails that NFT with `no_response`.
/// Results past the end of `nft_ids` are ignored.
pub fn results_per_nft<E: Clone>(
    nft_ids: &[Nat],
    reply: Result<Vec<Option<Result<(), E>>>, E>,
    no_response: E,
) -> Vec<(Nat, Result<(), E>)> {
    match reply {
        Ok(items) => {
            let mut items = items.into_iter();
            nft_ids
                .iter()
                .map(|id| {
                    let result = items
                        .next()
                        .flatten()
                        .unwrap_or_else(|| Err(no_response.clone()));
                    (id.clone(), result)
                })
                .collect()
        }
        Err(e) => nft_ids
            .iter()
            .map(|id| (id.clone(), Err(e.clone())))
            .collect(),
    }
}

#[derive(Debug, Default)]
pub struct GroupedNftsByCanister {
    pub grouped: HashMap<CanisterId, Vec<Nat>>,
}

impl GroupedNftsByCanister {
    pub fn from_nfts(nfts: impl IntoIterator<Item = Nft>) -> Self {
        let mut grouped: HashMap<Principal, Vec<Nat>> = HashMap::new();

        for nft in nfts {
            grouped.entry(nft.canister_id).or_default().push(nft.id);
        }

        Self { grouped }
    }

    pub fn add_nft(&mut self, canister_id: CanisterId, nft_id: Nat) {
        self.grouped.entry(canister_id).or_default().push(nft_id);
    }

    pub fn exclude_nft(mut self, nft: Nft) -> Self {
        if let Some(ids) = self.grouped.get_mut(&nft.canister_id) {
            ids.retain(|id| id != &nft.id);

            // Remove the entire canister entry if it has no NFTs left
            if ids.is_empty() {
                self.grouped.remove(&nft.canister_id);
            }
        }
        self
    }

    pub async fn validate_all_owned_by(&self, user: Principal) -> Vec<Result<Nft, GeneralError>> {
        let mut results = Vec::new();

        for (canister_id, ids) in &self.grouped {
            match icrc7_owner_of(*canister_id, ids.clone()).await {
                Ok(owners) => {
                    for (idx, owner_opt) in owners.iter().enumerate() {
                        let nft = Nft {
                            canister_id: *canister_id,
                            id: ids[idx].clone(),
                        };

                        match owner_opt {
                            Some(owner) if *owner == user.into() => {
                                results.push(Ok(nft));
                            }
                            _ => {
                                results.push(Err(GeneralError::UserIsNotNftOwner(format!(
                                    "User {:?} is not owner of the nft {:?} from the cansiter {:?}",
                                    user, ids[idx], canister_id
                                ))));
                            }
                        }
                    }
                }
                Err(e) => {
                    for id in ids {
                        results.push(Err(GeneralError::CallError(format!(
                            "Canister {canister_id:?}, NFT {id:?}: {e:?}"
                        ))));
                    }
                }
            }
        }

        results
    }

    /// Moves the NFTs from `from` to gldt_swap with `icrc37_transfer_from`, one call per
    /// collection. Each requested NFT gets its own result; read one with [nft_transfer_outcome].
    pub async fn batch_transfer_from_all(
        &self,
        from: Principal,
    ) -> NftTransferResults<TransferFromError> {
        // Step 1: collect metadata and futures separately
        let mut metadata: Vec<(Principal, Vec<Nat>)> = Vec::new();
        let mut futures: Vec<_> = Vec::new();

        for (canister_id, nft_ids) in &self.grouped {
            info!(
            "Preparing transfer for {} NFTs from {:?} to self canister {:?} (target canister_id={})",
            nft_ids.len(),
            from,
            ic_cdk::api::canister_self(),
            canister_id
        );

            let transfers: Vec<TransferFromArg> = nft_ids
                .iter()
                .map(|token_id| TransferFromArg {
                    spender_subaccount: None,
                    from: Account {
                        owner: from,
                        subaccount: None,
                    },
                    to: ic_cdk::api::canister_self().into(),
                    token_id: token_id.clone(),
                    memo: None,
                    created_at_time: None,
                })
                .collect();

            metadata.push((*canister_id, nft_ids.clone()));
            futures.push(icrc37_transfer_from(*canister_id, transfers));
        }

        info!(
            "Executing {} batch transfer futures in parallel",
            futures.len()
        );

        // Step 2: await all futures in parallel
        let transfer_results: Vec<_> = join_all(futures).await;

        // Step 3: zip metadata and results back together
        let mut all_results: NftTransferResults<TransferFromError> = BTreeMap::new();

        for ((canister_id, nft_ids), call_result) in metadata.into_iter().zip(transfer_results) {
            info!(
                "Processing transfer result for canister_id={} ({} NFTs)",
                canister_id,
                nft_ids.len()
            );

            let reply = match call_result {
                // the call returned a result per NFT
                Ok(Ok(items)) => Ok(items
                    .into_iter()
                    .map(|item| {
                        item.map(|result| match result {
                            TransferFromResult::Ok(_) => Ok(()),
                            TransferFromResult::Err(e) => Err(e),
                        })
                    })
                    .collect()),
                // the call returned a batch-level error
                Ok(Err(batch_err)) => Err(batch_err),
                // the inter-canister call itself failed (network / candid / system error)
                Err(e) => {
                    let msg = format!("{:?}", e);
                    error!(
                        "Inter-canister call failed for canister {}: {}",
                        canister_id, msg
                    );
                    Err(TransferFromError::GenericError {
                        error_code: Nat::from(0_u64),
                        message: format!("Batch transfer call failed: {}", msg),
                    })
                }
            };
            let results = results_per_nft(
                &nft_ids,
                reply,
                TransferFromError::GenericError {
                    error_code: Nat::from(0_u64),
                    message: "No response from transfer".to_string(),
                },
            );
            for (id, result) in &results {
                match result {
                    Ok(()) => info!("NFT {:?} successfully transferred from {:?}", id, from),
                    Err(e) => error!("NFT {:?} transfer error: {:?}", id, e),
                }
            }

            all_results.insert(canister_id, results);
        }

        info!(
            "Batch transfer finished for {} canisters",
            all_results.len()
        );

        all_results
    }

    /// Moves the NFTs from gldt_swap to `to` with `icrc7_transfer`, one call per collection.
    /// Each requested NFT gets its own result; read one with [nft_transfer_outcome].
    pub async fn batch_transfer_all(&self, to: Principal) -> NftTransferResults<TransferError> {
        let mut all_results: NftTransferResults<TransferError> = BTreeMap::new();

        for (canister_id, nft_ids) in &self.grouped {
            let transfers: Vec<TransferArg> = nft_ids
                .iter()
                .map(|token_id| TransferArg {
                    to: to.into(),
                    token_id: token_id.clone(),
                    from_subaccount: None,
                    memo: None,
                    created_at_time: None,
                })
                .collect();

            let reply = match icrc7_transfer(*canister_id, transfers).await {
                // the id the canister echoes is not used: each result is paired with the
                // requested id
                Ok(items) => Ok(items
                    .into_iter()
                    .map(|item| item.map(|result| result.map(|_| ())))
                    .collect()),
                Err(e) => Err(TransferError::GenericError {
                    error_code: Nat::from(0_u64),
                    message: format!("Batch transfer failed: {}", e),
                }),
            };
            let results = results_per_nft(
                nft_ids,
                reply,
                TransferError::GenericError {
                    error_code: Nat::from(0_u64),
                    message: "No response from transfer".to_string(),
                },
            );

            all_results.insert(*canister_id, results);
        }

        all_results
    }

    /// What the NFTs are worth, added up per ledger, as `SwapConfigs::token_equivalent` values
    /// them.
    pub fn calculate_token_equivalent(&self) -> Result<HashMap<Principal, Nat>, GeneralError> {
        let nfts: Vec<Nft> = self
            .grouped
            .iter()
            .flat_map(|(canister_id, ids)| {
                ids.iter().map(|id| Nft {
                    canister_id: *canister_id,
                    id: id.clone(),
                })
            })
            .collect();
        read_state(|s| s.data.swap_configs.token_equivalent(&nfts))
    }

    pub fn calculate_fees_amount(&self) -> Result<HashMap<Principal, Nat>, GeneralError> {
        let swap_configs = read_state(|s| s.data.swap_configs.clone());

        let mut fee_totals: HashMap<Principal, Nat> = HashMap::new();

        for (canister_id, token_ids) in &self.grouped {
            let config = swap_configs.find_by_canister_id(canister_id)?;

            for token_id in token_ids {
                // Get the swap fee for this token
                let fee = config
                    .fractionalization_config
                    .swap_fee_for_token(token_id)?;

                // Ledger ID
                let ledger_id = config.fractionalization_config.get_ledger_id()?;

                *fee_totals.entry(ledger_id).or_insert(Nat::from(0_u64)) += fee;
            }
        }

        Ok(fee_totals)
    }

    // Removes all NFTs that appear in the provided guard set.
    pub fn filter(mut self, nft_guards: &BTreeSet<Nft>) -> Self {
        for (canister_id, ids) in self.grouped.iter_mut() {
            ids.retain(|id| {
                let nft = Nft {
                    canister_id: *canister_id,
                    id: id.clone(),
                };
                !nft_guards.contains(&nft)
            });
        }

        // Clean up empty entries
        self.grouped.retain(|_, ids| !ids.is_empty());

        self
    }
}

#[cfg(test)]
mod tests {

    use super::*;
    use candid::{Nat, Principal};
    use gldt_swap_common::nft::Nft;
    use gldt_swap_common::swap_canister_config::SwapCanisterConfig;
    use std::collections::HashSet;

    use crate::{
        model::swap_configs::SwapConfigs,
        state::{init_state, mutate_state, RuntimeState},
    };

    fn init_runtime_state() {
        init_state(RuntimeState::default());
    }

    fn sum_result_map(
        result: Result<HashMap<Principal, Nat>, GeneralError>,
    ) -> Result<Nat, GeneralError> {
        result.map(|map| {
            map.values()
                .fold(Nat::from(0u128), |acc, val| acc + val.clone())
        })
    }

    fn collection(n: u8) -> Principal {
        Principal::from_slice(&[n; 10])
    }

    fn nft(collection_id: u8, id: u64) -> Nft {
        Nft {
            canister_id: collection(collection_id),
            id: Nat::from(id),
        }
    }

    fn ids(ids: &[u64]) -> Vec<Nat> {
        ids.iter().map(|id| Nat::from(*id)).collect()
    }

    fn rejected(message: &str) -> TransferFromError {
        TransferFromError::GenericError {
            error_code: Nat::from(0_u64),
            message: message.to_string(),
        }
    }

    fn no_response() -> TransferFromError {
        rejected("No response from transfer")
    }

    type PerNft = Vec<(Nat, Result<(), TransferFromError>)>;

    fn by_collection(entries: Vec<(u8, PerNft)>) -> NftTransferResults<TransferFromError> {
        entries
            .into_iter()
            .map(|(c, results)| (collection(c), results))
            .collect()
    }

    fn is_failed_with(
        outcome: NftTransferOutcome<'_, TransferFromError>,
        expected: &TransferFromError,
    ) -> bool {
        matches!(outcome, NftTransferOutcome::Failed(e) if format!("{e:?}") == format!("{expected:?}"))
    }

    #[test]
    fn an_error_for_another_nft_of_the_batch_never_fails_this_one() {
        // the collection answered [Ok, Err, Ok]: only NFT 2 failed
        let per_nft = results_per_nft(
            &ids(&[1, 2, 3]),
            Ok(vec![
                Some(Ok(())),
                Some(Err(TransferFromError::Unauthorized)),
                Some(Ok(())),
            ]),
            no_response(),
        );
        let results = by_collection(vec![(1, per_nft)]);
        assert!(matches!(
            nft_transfer_outcome(&results, &nft(1, 1)),
            NftTransferOutcome::Moved
        ));
        assert!(matches!(
            nft_transfer_outcome(&results, &nft(1, 2)),
            NftTransferOutcome::Failed(TransferFromError::Unauthorized)
        ));
        assert!(matches!(
            nft_transfer_outcome(&results, &nft(1, 3)),
            NftTransferOutcome::Moved
        ));

        // an error first in the vector does not count against a later NFT either
        let per_nft = results_per_nft(
            &ids(&[7, 8]),
            Ok(vec![
                Some(Err(TransferFromError::Unauthorized)),
                Some(Ok(())),
            ]),
            no_response(),
        );
        let results = by_collection(vec![(1, per_nft)]);
        assert!(matches!(
            nft_transfer_outcome(&results, &nft(1, 8)),
            NftTransferOutcome::Moved
        ));
        // nor does an error in another collection
        let results_two = {
            let mut r = results.clone();
            r.insert(
                collection(2),
                vec![(Nat::from(8u8), Err(TransferFromError::Unauthorized))],
            );
            r
        };
        assert!(matches!(
            nft_transfer_outcome(&results_two, &nft(1, 8)),
            NftTransferOutcome::Moved
        ));
    }

    #[test]
    fn a_batch_error_or_a_failed_call_fails_every_nft_of_that_call() {
        let batch_error = TransferFromError::GenericBatchError {
            error_code: Nat::from(1_u64),
            message: "too many".to_string(),
        };
        let call_failed = rejected("Batch transfer call failed: reject");
        let results = by_collection(vec![
            (
                1,
                results_per_nft(&ids(&[1, 2]), Err(batch_error.clone()), no_response()),
            ),
            (
                2,
                results_per_nft(&ids(&[1]), Err(call_failed.clone()), no_response()),
            ),
            (
                3,
                results_per_nft(&ids(&[5]), Ok(vec![Some(Ok(()))]), no_response()),
            ),
        ]);
        assert!(is_failed_with(
            nft_transfer_outcome(&results, &nft(1, 1)),
            &batch_error
        ));
        assert!(is_failed_with(
            nft_transfer_outcome(&results, &nft(1, 2)),
            &batch_error
        ));
        assert!(is_failed_with(
            nft_transfer_outcome(&results, &nft(2, 1)),
            &call_failed
        ));
        // the other collection's call is decided on its own
        assert!(matches!(
            nft_transfer_outcome(&results, &nft(3, 5)),
            NftTransferOutcome::Moved
        ));
    }

    #[test]
    fn a_missing_reply_fails_that_nft() {
        // NFT 2 answered `None`, NFT 3 not at all; a result past the request is ignored
        let per_nft = results_per_nft(
            &ids(&[1, 2, 3]),
            Ok(vec![Some(Ok(())), None]),
            no_response(),
        );
        let results = by_collection(vec![(1, per_nft)]);
        assert!(matches!(
            nft_transfer_outcome(&results, &nft(1, 1)),
            NftTransferOutcome::Moved
        ));
        assert!(is_failed_with(
            nft_transfer_outcome(&results, &nft(1, 2)),
            &no_response()
        ));
        assert!(is_failed_with(
            nft_transfer_outcome(&results, &nft(1, 3)),
            &no_response()
        ));

        let longer = results_per_nft(
            &ids(&[1]),
            Ok(vec![Some(Ok(())), Some(Ok(())), Some(Ok(()))]),
            no_response(),
        );
        assert_eq!(longer.len(), 1);
        assert_eq!(longer[0].0, Nat::from(1u8));
        assert!(longer[0].1.is_ok());
    }

    #[test]
    fn an_nft_the_results_do_not_hold_has_no_entry() {
        let results = by_collection(vec![(
            1,
            results_per_nft(&ids(&[1]), Ok(vec![Some(Ok(()))]), no_response()),
        )]);
        assert!(matches!(
            nft_transfer_outcome(&results, &nft(1, 2)),
            NftTransferOutcome::NoEntry
        ));
        assert!(matches!(
            nft_transfer_outcome(&results, &nft(2, 1)),
            NftTransferOutcome::NoEntry
        ));
    }

    #[test]
    fn test_update_neuron_rewards() {
        init_runtime_state();

        let swap_config_1000 = SwapCanisterConfig {
            icrc7_canister_id: Principal::from_text("7i7jl-6qaaa-aaaam-abjma-cai").unwrap(),
            fractionalization_config:
                gldt_swap_common::swap_canister_config::FractionalizationConfig::General(
                    gldt_swap_common::swap_canister_config::GeneralFractionalizationConfig {
                        division: 1000,
                        swap_fee: Nat::from(100_000_000_u64),
                        ledger_id: Principal::from_text("6c7su-kiaaa-aaaar-qaira-cai").unwrap(),
                    },
                ),
        };
        let swap_config_100 = SwapCanisterConfig {
            icrc7_canister_id: Principal::from_text("zhfjc-liaaa-aaaal-acgja-cai").unwrap(),
            fractionalization_config:
                gldt_swap_common::swap_canister_config::FractionalizationConfig::General(
                    gldt_swap_common::swap_canister_config::GeneralFractionalizationConfig {
                        division: 100,
                        swap_fee: Nat::from(100_000_000_u64),
                        ledger_id: Principal::from_text("6c7su-kiaaa-aaaar-qaira-cai").unwrap(),
                    },
                ),
        };
        let swap_config_10 = SwapCanisterConfig {
            icrc7_canister_id: Principal::from_text("sy3ra-iqaaa-aaaao-aixda-cai").unwrap(),
            fractionalization_config:
                gldt_swap_common::swap_canister_config::FractionalizationConfig::General(
                    gldt_swap_common::swap_canister_config::GeneralFractionalizationConfig {
                        division: 10,
                        swap_fee: Nat::from(100_000_000_u64),
                        ledger_id: Principal::from_text("6c7su-kiaaa-aaaar-qaira-cai").unwrap(),
                    },
                ),
        };
        let swap_config_1 = SwapCanisterConfig {
            icrc7_canister_id: Principal::from_text("io7gn-vyaaa-aaaak-qcbiq-cai").unwrap(),
            fractionalization_config:
                gldt_swap_common::swap_canister_config::FractionalizationConfig::General(
                    gldt_swap_common::swap_canister_config::GeneralFractionalizationConfig {
                        division: 1,
                        swap_fee: Nat::from(100_000_000_u64),
                        ledger_id: Principal::from_text("6c7su-kiaaa-aaaar-qaira-cai").unwrap(),
                    },
                ),
        };
        mutate_state(|state| {
            state.data.swap_configs = SwapConfigs::from_vec(vec![
                swap_config_1000,
                swap_config_100,
                swap_config_10,
                swap_config_1,
            ]);
        });

        let nfts: HashSet<Nft> = [
            Nft {
                canister_id: Principal::from_text("sy3ra-iqaaa-aaaao-aixda-cai").unwrap(), // 10
                id: Nat::from(4u64),
            },
            Nft {
                canister_id: Principal::from_text("zhfjc-liaaa-aaaal-acgja-cai").unwrap(), // 100
                id: Nat::from(1u64),
            },
            Nft {
                canister_id: Principal::from_text("zhfjc-liaaa-aaaal-acgja-cai").unwrap(), // 100
                id: Nat::from(2u64),
            },
            Nft {
                canister_id: Principal::from_text("io7gn-vyaaa-aaaak-qcbiq-cai").unwrap(), // 1
                id: Nat::from(101u64),
            },
        ]
        .into_iter()
        .collect();

        let nfts_batch = GroupedNftsByCanister::from_nfts(nfts);

        let totals = sum_result_map(nfts_batch.calculate_token_equivalent()).unwrap();
        assert_eq!(totals, Nat::from(211_u64));
    }
}
