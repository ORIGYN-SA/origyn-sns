use std::cell::RefCell;
use ic_stable_structures::{StableBTreeMap, StableVec};
use token_metrics_api::types::ledger_indexer::{
    AccountDayKey, ActivitySnapshot, HistoryBalanceCache, HistoryData, LedgerAccount, Overview,
    ProcessedTX,
};
use crate::memory::{self, VM};

thread_local! {
    // Memory region 1: Account overviews (LedgerAccount → Overview)
    static ACCOUNT_OVERVIEWS: RefCell<StableBTreeMap<LedgerAccount, Overview, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::ACCOUNT_OVERVIEWS))
    );
    // Memory region 2: Account history (AccountDayKey → HistoryData)
    static ACCOUNT_HISTORY: RefCell<StableBTreeMap<AccountDayKey, HistoryData, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::ACCOUNT_HISTORY))
    );
    // Memory region 3: Account history balance cache (LedgerAccount → HistoryBalanceCache)
    static ACCOUNT_HISTORY_CACHE: RefCell<StableBTreeMap<LedgerAccount, HistoryBalanceCache, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::ACCOUNT_HISTORY_CACHE))
    );
    // Memory region 9: Activity snapshots (daily activity records)
    static ACTIVITY_SNAPSHOTS: RefCell<StableVec<ActivitySnapshot, VM>> = RefCell::new(
        StableVec::init(memory::get_memory(memory::ACTIVITY_SNAPSHOTS))
    );
    // Memory region 10: Transaction cache (block_number → ProcessedTX)
    static TRANSACTION_CACHE: RefCell<StableBTreeMap<u64, ProcessedTX, VM>> = RefCell::new(
        StableBTreeMap::init(memory::get_memory(memory::TRANSACTION_CACHE))
    );
}

// ============================================================================
// Public accessor functions
// ============================================================================

// --- Account Overviews ---
pub fn with_overviews<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<LedgerAccount, Overview, VM>) -> R,
{
    ACCOUNT_OVERVIEWS.with(|m| f(&m.borrow()))
}

pub fn with_overviews_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<LedgerAccount, Overview, VM>) -> R,
{
    ACCOUNT_OVERVIEWS.with(|m| f(&mut m.borrow_mut()))
}

// --- Account History ---
pub fn with_history<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<AccountDayKey, HistoryData, VM>) -> R,
{
    ACCOUNT_HISTORY.with(|m| f(&m.borrow()))
}

pub fn with_history_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<AccountDayKey, HistoryData, VM>) -> R,
{
    ACCOUNT_HISTORY.with(|m| f(&mut m.borrow_mut()))
}

// --- Account History Cache ---
pub fn with_history_cache<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<LedgerAccount, HistoryBalanceCache, VM>) -> R,
{
    ACCOUNT_HISTORY_CACHE.with(|m| f(&m.borrow()))
}

pub fn with_history_cache_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<LedgerAccount, HistoryBalanceCache, VM>) -> R,
{
    ACCOUNT_HISTORY_CACHE.with(|m| f(&mut m.borrow_mut()))
}

// --- Activity Snapshots ---
pub fn with_activity_snapshots<F, R>(f: F) -> R
where
    F: FnOnce(&StableVec<ActivitySnapshot, VM>) -> R,
{
    ACTIVITY_SNAPSHOTS.with(|m| f(&m.borrow()))
}

pub fn with_activity_snapshots_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableVec<ActivitySnapshot, VM>) -> R,
{
    ACTIVITY_SNAPSHOTS.with(|m| f(&mut m.borrow_mut()))
}

// --- Transaction Cache ---
pub fn with_transaction_cache<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<u64, ProcessedTX, VM>) -> R,
{
    TRANSACTION_CACHE.with(|m| f(&m.borrow()))
}

pub fn with_transaction_cache_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<u64, ProcessedTX, VM>) -> R,
{
    TRANSACTION_CACHE.with(|m| f(&mut m.borrow_mut()))
}
