use std::cell::RefCell;
use ic_stable_memory::derive::{AsFixedSizeBytes, StableType};
use crate::store::tx_store::TxStore;

thread_local! {
    pub static STABLE_STATE: RefCell<Option<Main>> = RefCell::default();
}

#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct Main {
    pub tx_store: TxStore,
}