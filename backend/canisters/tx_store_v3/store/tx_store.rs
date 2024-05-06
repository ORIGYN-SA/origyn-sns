use ic_stable_memory::{collections::SBTreeMap, derive::{StableType, AsFixedSizeBytes}};

use crate::core::utils::log;

use super::custom_types::SmallTX;


#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct TxStore {
    blocks: SBTreeMap<u64, SmallTX>,
    next_block: u64,
}
impl TxStore {
    pub fn add_tx(&mut self, small_tx: SmallTX) -> bool {
        let nb: u64 = self.next_block;
        match self.blocks.insert(nb, small_tx) {
            Ok(prev) => {
                self.next_block += 1;
                return true;
            },
            Err((k, v)) => {
                log(format!("Out of memory. Unable to insert pair: {}, {:?}",k, v));
                return false;
            }
        };
    }

    pub fn get_tx(&self, block: u64) -> Option<SmallTX> {
        match self.blocks.get(&block) {
            Some(value) => {
                let tx: SmallTX = *value;
                return Some(tx);
            },
            None => { return None}
        };
    }

    pub fn get_multiple_tx(&self, block_vec: Vec<u64>) -> Vec<Option<SmallTX>> {
        let mut ret_vec:Vec<Option<SmallTX>> = Vec::new();
        for id_ref in &block_vec {
            match self.blocks.get(&id_ref) {
                Some(value) => {
                    let tx: SmallTX = *value;
                    ret_vec.push(Some(tx));
                },
                None => { ret_vec.push(None)}
            };
        }
       return  ret_vec;
    }

    pub fn get_count(&self) -> u64 {
        self.next_block // is +1 but this accounts for 0 starting index
    }

}