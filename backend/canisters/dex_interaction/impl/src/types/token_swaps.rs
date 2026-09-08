use crate::memory::get_swap_history_memory;
use crate::memory::VM;
use crate::types::*;
use candid::CandidType;
use dex_interaction_api::get_active_swaps::Response;
use ic_stable_structures::StableBTreeMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::error;
use types::TimestampMillis;

#[derive(Serialize, Deserialize)]
pub struct TokenSwaps {
    pub next_id: u128,
    pub swaps: HashMap<u128, TokenSwap>,
    #[serde(skip, default = "init_map")]
    pub history: StableBTreeMap<u128, TokenSwap, VM>,
}

fn init_map() -> StableBTreeMap<u128, TokenSwap, VM> {
    let memory = get_swap_history_memory();
    StableBTreeMap::init(memory)
}

impl Default for TokenSwaps {
    fn default() -> Self {
        Self {
            next_id: 0,
            swaps: HashMap::new(),
            history: init_map(),
        }
    }
}

impl TokenSwaps {
    pub fn push_new(&mut self, swap_config: SwapConfig, now: TimestampMillis) -> TokenSwap {
        let id = self.next_id;
        self.next_id += 1;

        let token_swap = TokenSwap::new(id, swap_config.swap_client_id, now);
        self.swaps.insert(id, token_swap.clone());

        token_swap
    }

    pub fn upsert(&mut self, swap: TokenSwap) {
        self.swaps.insert(swap.swap_id, swap);
    }

    pub fn get(&self, swap_id: u128) -> Option<&TokenSwap> {
        self.swaps.get(&swap_id)
    }

    pub fn iter(&self) -> impl Iterator<Item = &TokenSwap> {
        self.swaps.values()
    }

    pub fn get_next_id(&self) -> u128 {
        self.next_id
    }

    pub fn get_swap_info(&self, swap_id: u128) -> Option<TokenSwap> {
        let swap_info_incomplete = self.swaps.get(&swap_id).cloned();
        let swap_info_completed = self.history.get(&swap_id);
        swap_info_incomplete.or(swap_info_completed)
    }

    pub fn archive_swap(&mut self, swap_id: u128) -> Result<(), String> {
        let swap_info = self.swaps.get(&swap_id);
        match swap_info {
            Some(swap) => {
                let mut modified_swap = swap.clone();
                modified_swap.is_archived = true;
                self.history.insert(swap_id, modified_swap.clone());
                self.swaps.remove(&swap_id);
                Ok(())
            }
            None => {
                error!("Failed to archive {swap_id}. Swap not found");
                Err(format!("Failed to archive {}. Swap not found", swap_id))
            }
        }
    }

    pub fn get_active_swaps(&self) -> Response {
        self.swaps.clone()
    }

    pub fn archive_all_active_swaps(&mut self) {
        let swap_ids: Vec<u128> = self.swaps.keys().copied().collect();
        for swap_id in swap_ids {
            let _ = self.archive_swap(swap_id);
        }
    }

    pub fn get_metrics(&self) -> TokenSwapsMetrics {
        TokenSwapsMetrics {
            active_swaps: self.swaps.clone(),
            active_swaps_len: self.swaps.len() as u64,
            history_len: self.history.len(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_archive_all_active_swaps() {
        let mut token_swaps = TokenSwaps::default();
        let swap1 = TokenSwap::new(1, 100, 1000);
        let swap2 = TokenSwap::new(2, 100, 2000);
        token_swaps.upsert(swap1);
        token_swaps.upsert(swap2);

        assert_eq!(token_swaps.swaps.len(), 2);
        assert_eq!(token_swaps.history.len(), 0);

        token_swaps.archive_all_active_swaps();

        assert_eq!(token_swaps.swaps.len(), 0);
        assert_eq!(token_swaps.history.len(), 2);
        assert!(token_swaps.get_swap_info(1).unwrap().is_archived);
        assert!(token_swaps.get_swap_info(2).unwrap().is_archived);
    }
}

#[derive(CandidType, Serialize)]
pub struct TokenSwapsMetrics {
    active_swaps: HashMap<u128, TokenSwap>,
    active_swaps_len: u64,
    history_len: u64,
}
