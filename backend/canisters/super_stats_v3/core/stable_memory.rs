use std::cell::RefCell;

use ic_cdk_timers::TimerId;
use ic_stable_memory::derive::{AsFixedSizeBytes, StableType};
use crate::stats::{directory::Directory, account_tree::AccountTree};

thread_local! {
    pub static STABLE_STATE: RefCell<Option<Main>> = RefCell::default();
}

#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct Main {
    pub account_data: AccountTree,
    pub principal_data: AccountTree,
    pub directory_data: Directory
}
// Impl for Main is in indexer/account_tree.rs 