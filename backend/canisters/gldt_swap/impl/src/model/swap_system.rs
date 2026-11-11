use crate::model::swap_configs::SwapConfigs;
use bity_ic_canister_time::timestamp_millis;
use candid::{Nat, Principal};
use gldt_swap_common::nft::Nft;
use gldt_swap_common::swap::{SwapIndex, SwapInfo, SwapStatus, SwapType};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use types::TimestampMillis;

#[derive(Serialize, Deserialize)]
pub struct SwapSystem {
    pub swaps: HashMap<SwapIndex, SwapInfo>,
    pub failed_swaps: HashMap<SwapIndex, SwapInfo>,
    pub latest_timestamp: TimestampMillis,
    pub last_index: SwapIndex,
    /// Every swap ever inserted. The supply balancer skips a run when it changes across the
    /// run's reads.
    #[serde(default)]
    pub swaps_started: u64,
}

impl Default for SwapSystem {
    fn default() -> Self {
        let now = timestamp_millis();
        Self {
            swaps: HashMap::new(),
            failed_swaps: HashMap::new(),
            latest_timestamp: now,
            last_index: Nat::from(0_u64),
            swaps_started: 0,
        }
    }
}

impl SwapSystem {
    pub fn create_swap(
        &mut self,
        swap_type: SwapType,
        user: Principal,
        nft: &Nft,
        swap_configs: &SwapConfigs,
    ) -> Result<SwapIndex, gldt_swap_common::general_error::GeneralError> {
        // Generate new index
        let index = self.get_new_index();

        // Get token equivalent for this NFT
        let nft_token_equivalent = swap_configs.get_nft_equivalent(nft)?;

        // Build SwapInfo
        let swap_info = SwapInfo::new(
            index.clone(),
            swap_type,
            user.into(),
            nft.clone(),
            nft_token_equivalent,
        );

        // Insert it immediately
        self.insert_swap(index.clone(), swap_info);

        Ok(index)
    }

    pub fn create_swaps_batch<I>(
        &mut self,
        swap_type: SwapType,
        user: Principal,
        nfts: I,
        swap_configs: &SwapConfigs,
    ) -> Result<HashMap<SwapIndex, SwapInfo>, gldt_swap_common::general_error::GeneralError>
    where
        I: IntoIterator<Item = Nft>,
    {
        let nfts_iter = nfts.into_iter();
        let (lower, _) = nfts_iter.size_hint();
        let mut results = HashMap::with_capacity(lower);

        for nft in nfts_iter {
            let eq = swap_configs.get_nft_equivalent(&nft)?;

            let index = self.get_new_index();

            let swap_info = SwapInfo::new(index.clone(), swap_type, user.into(), nft, eq);

            self.insert_swap(index.clone(), swap_info.clone());

            results.insert(index, swap_info);
        }

        self.latest_timestamp = timestamp_millis();

        Ok(results)
    }

    pub fn get_new_index(&self) -> SwapIndex {
        self.last_index.clone()
    }

    /// The one place a new swap is inserted.
    pub fn insert_swap(&mut self, swap_id: SwapIndex, info: SwapInfo) {
        self.latest_timestamp = timestamp_millis();
        self.swaps.insert(swap_id.clone(), info.clone());
        self.last_index += SwapIndex::from(1u64);
        self.swaps_started = self.swaps_started.wrapping_add(1);
    }

    pub fn get_swap(&self, swap_id: &SwapIndex) -> Option<&SwapInfo> {
        self.swaps.get(swap_id)
    }

    pub fn get_active_swap_by_ids(&self, ids: &HashSet<SwapIndex>) -> HashMap<SwapIndex, SwapInfo> {
        self.swaps
            .iter()
            .filter(|(index, _)| ids.contains(*index))
            .map(|(index, swap_info)| (index.clone(), swap_info.clone()))
            .collect()
    }

    pub fn get_failed_swap_by_ids(&self, ids: &HashSet<SwapIndex>) -> HashMap<SwapIndex, SwapInfo> {
        self.failed_swaps
            .iter()
            .filter(|(index, _)| ids.contains(*index))
            .map(|(index, swap_info)| (index.clone(), swap_info.clone()))
            .collect()
    }

    pub fn get_mut_swap(&mut self, swap_id: &SwapIndex) -> Option<&mut SwapInfo> {
        self.swaps.get_mut(swap_id)
    }

    pub fn get_all_swaps(&self) -> HashMap<SwapIndex, SwapInfo> {
        self.swaps.clone()
    }

    pub fn get_failed_swaps(&self) -> HashMap<SwapIndex, SwapInfo> {
        self.failed_swaps.clone()
    }

    pub fn get_active_swaps_by_user_principal(
        &self,
        user_principal: Principal,
    ) -> HashMap<SwapIndex, SwapInfo> {
        self.swaps
            .iter()
            .filter(|(_, swap_info)| swap_info.user_account.owner == user_principal)
            .map(|(swap_id, swap_info)| (swap_id.clone(), swap_info.clone()))
            .collect()
    }

    pub fn get_failed_swaps_by_user_principal(
        &self,
        user_principal: Principal,
    ) -> HashMap<SwapIndex, SwapInfo> {
        self.failed_swaps
            .iter()
            .filter(|(_, swap_info)| swap_info.user_account.owner == user_principal)
            .map(|(swap_id, swap_info)| (swap_id.clone(), swap_info.clone()))
            .collect()
    }

    pub fn update_swaps_statuses(&mut self, swap_ids: &[SwapIndex], new_status: SwapStatus) {
        for swap_id in swap_ids {
            if let Some(swap) = self.get_mut_swap(swap_id) {
                // Attempt to update, ignore errors
                let _ = swap.update_status(new_status.clone());
            }
        }
    }

    pub fn update_swaps_status(&mut self, swap_id: &SwapIndex, new_status: SwapStatus) {
        if let Some(swap) = self.get_mut_swap(swap_id) {
            let _ = swap.update_status(new_status.clone());
        }
    }

    pub fn filter_swaps_to_reimburse(&self, ids: &[SwapIndex]) -> HashMap<SwapIndex, SwapInfo> {
        self.filter_swaps_by(ids, |status| {
            matches!(
                status,
                SwapStatus::NftTransferFailed(_) | SwapStatus::MintFailed(_)
            )
        })
    }

    pub fn filter_completed_swaps(&self, ids: &[SwapIndex]) -> HashMap<SwapIndex, SwapInfo> {
        self.filter_swaps_by(ids, |status| matches!(status, SwapStatus::Complete))
    }

    pub fn filter_swaps_by<F>(
        &self,
        ids: &[SwapIndex],
        predicate: F,
    ) -> HashMap<SwapIndex, SwapInfo>
    where
        F: Fn(&SwapStatus) -> bool,
    {
        ids.iter()
            .filter_map(|id| {
                self.swaps.get(id).and_then(|s| {
                    if predicate(&s.status) {
                        Some((id.clone(), s.clone()))
                    } else {
                        None
                    }
                })
            })
            .collect()
    }

    pub fn remove_swap(&mut self, swap_id: &SwapIndex) -> Option<SwapInfo> {
        self.latest_timestamp = timestamp_millis();
        self.swaps.remove(swap_id)
    }

    pub fn remove_active_swaps(&mut self, swap_ids: Vec<SwapIndex>) {
        self.latest_timestamp = timestamp_millis();
        swap_ids.iter().for_each(|id| {
            self.swaps.remove(id);
        });
    }

    // Removes completed swaps and moves failed swaps to `failed_swaps`.
    pub fn finalize_swaps(&mut self, swap_ids: &[SwapIndex]) {
        self.latest_timestamp = timestamp_millis();

        for swap_id in swap_ids {
            if let Some(swap) = self.swaps.remove(swap_id) {
                match swap.status {
                    SwapStatus::Complete => {
                        continue;
                    }
                    SwapStatus::NftTransferFailed(_) | SwapStatus::MintFailed(_) => {
                        self.failed_swaps.insert(swap_id.clone(), swap);
                    }
                    _ => {
                        self.swaps.insert(swap_id.clone(), swap);
                    }
                }
            }
        }
    }

    /// Ends the swaps of one call, `swap_ids`: each leaves the active swaps, removed when
    /// `Complete` and moved to `failed_swaps` in any other status. Swaps of other calls stay
    /// active, except those older than
    /// [`gldt_swap_common::swap::STALE_SWAP_TIME_THRESHOLD_MINUTES`]: a call that
    /// trapped leaves its swaps behind, and they are ended the same way.
    pub fn finalize_call_swaps(&mut self, swap_ids: &[SwapIndex]) {
        self.latest_timestamp = timestamp_millis();

        let stale: Vec<SwapIndex> = self
            .swaps
            .iter()
            .filter(|(_, swap)| swap.is_swap_over_time_threshold())
            .map(|(swap_id, _)| swap_id.clone())
            .collect();

        for swap_id in swap_ids.iter().chain(&stale) {
            if let Some(swap) = self.swaps.remove(swap_id) {
                if swap.status != SwapStatus::Complete {
                    self.failed_swaps.insert(swap_id.clone(), swap);
                }
            }
        }
    }

    pub fn swaps_by_status(&self, status: SwapStatus) -> Vec<SwapInfo> {
        self.swaps
            .values()
            .filter(|swap| swap.status == status)
            .cloned()
            .collect()
    }

    pub fn bump_timestamp(&mut self) {
        self.latest_timestamp = timestamp_millis();
    }

    pub fn get_stuck_swaps(&self) -> Vec<(SwapIndex, SwapInfo)> {
        self.swaps
            .clone()
            .into_iter()
            .filter(|(_, swap_info)| swap_info.is_swap_over_time_threshold())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::swap_configs::SwapConfigs;
    use gldt_swap_common::swap_canister_config::{
        FractionalizationConfig, GeneralFractionalizationConfig, SwapCanisterConfig,
    };
    use types::TimestampMillis;

    #[test]
    fn swaps_started_counts_every_inserted_swap() {
        let nft_canister = Principal::from_slice(&[1; 10]);
        let configs = SwapConfigs::from_vec(vec![SwapCanisterConfig {
            icrc7_canister_id: nft_canister,
            fractionalization_config: FractionalizationConfig::General(
                GeneralFractionalizationConfig {
                    division: 100_000_000_000,
                    swap_fee: Nat::from(100_000_000u64),
                    ledger_id: Principal::from_slice(&[2; 10]),
                },
            ),
        }]);
        let nft = |id: u64| Nft {
            id: Nat::from(id),
            canister_id: nft_canister,
        };
        let user = Principal::from_slice(&[3; 29]);
        let mut system = SwapSystem::default();
        assert_eq!(system.swaps_started, 0);
        system
            .create_swaps_batch(SwapType::Forward, user, vec![nft(1), nft(2)], &configs)
            .unwrap();
        assert_eq!(system.swaps_started, 2);
        system
            .create_swap(SwapType::Reverse, user, &nft(3), &configs)
            .unwrap();
        assert_eq!(system.swaps_started, 3);
        // finishing or removing swaps does not move it
        let all: Vec<SwapIndex> = system.swaps.keys().cloned().collect();
        system.finalize_call_swaps(&all);
        assert!(system.swaps.is_empty());
        assert_eq!(system.swaps_started, 3);
    }

    #[test]
    fn finalizing_a_call_leaves_other_calls_in_flight_and_sweeps_old_leftovers() {
        let nft_canister = Principal::from_slice(&[1; 10]);
        let configs = SwapConfigs::from_vec(vec![SwapCanisterConfig {
            icrc7_canister_id: nft_canister,
            fractionalization_config: FractionalizationConfig::General(
                GeneralFractionalizationConfig {
                    division: 100_000_000_000,
                    swap_fee: Nat::from(100_000_000u64),
                    ledger_id: Principal::from_slice(&[2; 10]),
                },
            ),
        }]);
        let nfts = |ids: &[u64]| -> Vec<Nft> {
            ids.iter()
                .map(|id| Nft {
                    id: Nat::from(*id),
                    canister_id: nft_canister,
                })
                .collect()
        };
        let user = Principal::from_slice(&[3; 29]);
        let mut system = SwapSystem::default();
        let ids = |swaps: HashMap<SwapIndex, SwapInfo>| -> Vec<SwapIndex> {
            let mut ids: Vec<_> = swaps.into_keys().collect();
            ids.sort();
            ids
        };

        // a call that trapped long ago left a swap behind, one `Complete` and one in flight
        let leftover = ids(system
            .create_swaps_batch(SwapType::Forward, user, nfts(&[1, 2]), &configs)
            .unwrap());
        for id in &leftover {
            system.swaps.get_mut(id).unwrap().created_at = 0;
        }
        let swap = system.swaps.get_mut(&leftover[0]).unwrap();
        swap.update_status(SwapStatus::NftTransferredFrom).unwrap();
        swap.update_status(SwapStatus::Minted).unwrap();
        swap.update_status(SwapStatus::Complete).unwrap();
        // call B is in flight
        let b = ids(system
            .create_swaps_batch(SwapType::Reverse, user, nfts(&[3, 4]), &configs)
            .unwrap());
        system.update_swaps_statuses(&b, SwapStatus::Burned);
        // call A: one swap complete, one whose NFT did not move
        let a = ids(system
            .create_swaps_batch(SwapType::Forward, user, nfts(&[5, 6]), &configs)
            .unwrap());
        system.update_swaps_status(&a[0], SwapStatus::NftTransferredFrom);
        system.update_swaps_status(&a[0], SwapStatus::Minted);
        system.update_swaps_status(&a[0], SwapStatus::Complete);
        system.update_swaps_status(&a[1], SwapStatus::NftTransferFromFailed("no".to_string()));

        system.finalize_call_swaps(&a);

        // B's swaps are still active, untouched
        let mut active: Vec<_> = system.swaps.keys().cloned().collect();
        active.sort();
        assert_eq!(active, b);
        assert!(b
            .iter()
            .all(|id| system.swaps[id].status == SwapStatus::Burned));
        // A's complete swap is gone, its failed one is in `failed_swaps` with its status
        assert!(!system.failed_swaps.contains_key(&a[0]));
        assert_eq!(
            system.failed_swaps[&a[1]].status,
            SwapStatus::NftTransferFromFailed("no".to_string())
        );
        // the old leftovers are swept: the complete one removed, the other failed
        assert!(!system.failed_swaps.contains_key(&leftover[0]));
        assert_eq!(system.failed_swaps[&leftover[1]].status, SwapStatus::Init);
        assert_eq!(system.failed_swaps.len(), 2);

        // B finalizes its own swaps later
        system.finalize_call_swaps(&b);
        assert!(system.swaps.is_empty());
        assert_eq!(system.failed_swaps.len(), 4);
    }

    /// `SwapSystem` as deployed before the counter.
    #[derive(Serialize)]
    struct SwapSystemBefore {
        swaps: HashMap<SwapIndex, SwapInfo>,
        failed_swaps: HashMap<SwapIndex, SwapInfo>,
        latest_timestamp: TimestampMillis,
        last_index: SwapIndex,
    }

    #[test]
    fn old_swap_system_without_counter_deserializes() {
        let old = SwapSystemBefore {
            swaps: HashMap::new(),
            failed_swaps: HashMap::new(),
            latest_timestamp: 9,
            last_index: Nat::from(41u8),
        };
        let mut buf = Vec::new();
        bity_ic_serializer::serialize(&old, &mut buf).unwrap();
        let system: SwapSystem = bity_ic_serializer::deserialize(buf.as_slice()).unwrap();
        assert_eq!(system.swaps_started, 0);
        assert_eq!(system.last_index, Nat::from(41u8));
        assert_eq!(system.latest_timestamp, 9);
    }
}
