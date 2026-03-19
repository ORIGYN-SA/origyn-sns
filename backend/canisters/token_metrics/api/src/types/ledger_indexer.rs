use std::fmt;
use std::ops::Add;

use candid::{CandidType, Principal};
use minicbor::{Decode, Encode};
use serde::{Deserialize, Serialize};

use crate::impl_storable_minicbor;

// ============================================================================
// Semantic type aliases — zero-cost, purely for readability
// ============================================================================

/// Ledger block number
pub type BlockNumber = u64;
/// Timestamp in nanoseconds since Unix epoch
pub type TimestampNanos = u64;
/// Day number (timestamp_nanos / 86_400 / 1_000_000_000)
pub type DayNumber = u64;
/// Token amount in e8s (value, fee, balance)
pub type TokenAmount = u128;

// ============================================================================
// Storable types (live in stable memory via StableBTreeMap / StableVec)
// ============================================================================

#[derive(
    CandidType, Serialize, Deserialize, Clone, Default, Copy, Debug, PartialEq, Encode, Decode,
)]
pub struct Overview {
    #[n(0)]
    pub first_active: TimestampNanos,
    #[n(1)]
    pub last_active: TimestampNanos,
    #[n(2)]
    pub sent_count: u32,
    #[cbor(n(3), with = "crate::cbor::u128")]
    pub sent_value: TokenAmount,
    #[n(4)]
    pub received_count: u32,
    #[cbor(n(5), with = "crate::cbor::u128")]
    pub received_value: TokenAmount,
    #[cbor(n(6), with = "crate::cbor::u128")]
    pub balance: TokenAmount,
    #[cbor(n(7), with = "crate::cbor::u128")]
    pub max_balance: TokenAmount,
}

impl Overview {
    pub fn sent(&self) -> (u32, TokenAmount) {
        (self.sent_count, self.sent_value)
    }

    pub fn received(&self) -> (u32, TokenAmount) {
        (self.received_count, self.received_value)
    }

    pub fn debit_account(&mut self, time: TimestampNanos, value: TokenAmount, tx_fee: TokenAmount) {
        if self.first_active == 0 || time < self.first_active {
            self.first_active = time;
        }
        if self.last_active < time {
            self.last_active = time;
        }
        let total_deduction = value.saturating_add(tx_fee);
        self.balance = self.balance.saturating_sub(total_deduction);
        self.sent_count += 1;
        self.sent_value = self.sent_value.saturating_add(total_deduction);
    }

    /// Create a new Overview for a first-seen receive transaction.
    pub fn new_received(time: TimestampNanos, value: TokenAmount) -> Self {
        Overview {
            first_active: time,
            last_active: time,
            sent_count: 0,
            sent_value: 0,
            received_count: 1,
            received_value: value,
            balance: value,
            max_balance: value,
        }
    }

    pub fn credit_account(&mut self, time: TimestampNanos, value: TokenAmount) {
        if self.first_active == 0 || time < self.first_active {
            self.first_active = time;
        }
        if self.last_active < time {
            self.last_active = time;
        }
        self.balance = self.balance.saturating_add(value);
        if self.balance > self.max_balance {
            self.max_balance = self.balance;
        }
        self.received_count += 1;
        self.received_value = self.received_value.saturating_add(value);
    }
}

impl Add for Overview {
    type Output = Overview;

    fn add(self, other: Self) -> Self::Output {
        let new_balance = self.balance + other.balance;
        Overview {
            first_active: if self.first_active == 0 {
                other.first_active
            } else if other.first_active == 0 {
                self.first_active
            } else {
                self.first_active.min(other.first_active)
            },
            last_active: self.last_active.max(other.last_active),
            sent_count: self.sent_count + other.sent_count,
            sent_value: self.sent_value + other.sent_value,
            received_count: self.received_count + other.received_count,
            received_value: self.received_value + other.received_value,
            balance: new_balance,
            max_balance: self.max_balance.max(other.max_balance).max(new_balance),
        }
    }
}

impl_storable_minicbor!(Overview);

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug, PartialEq, Encode, Decode)]
pub struct HistoryData {
    #[cbor(n(0), with = "crate::cbor::u128")]
    pub balance: TokenAmount,
}

impl Add for HistoryData {
    type Output = HistoryData;

    fn add(self, other: Self) -> Self::Output {
        HistoryData {
            balance: self.balance + other.balance,
        }
    }
}

impl_storable_minicbor!(HistoryData);

#[derive(Encode, Decode, Clone, Default, Debug, PartialEq)]
pub struct HistoryBalanceCache {
    #[n(0)]
    pub day: DayNumber,
    #[n(1)]
    pub data: HistoryData,
}

impl_storable_minicbor!(HistoryBalanceCache);

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug, PartialEq, Encode, Decode)]
pub struct ActivitySnapshot {
    #[n(0)]
    pub start_time: TimestampNanos,
    #[n(1)]
    pub end_time: TimestampNanos,
    #[n(2)]
    pub total_unique_accounts: u64,
    #[n(3)]
    pub total_unique_principals: u64,
    #[n(4)]
    pub accounts_active_during_snapshot: u64,
    #[n(5)]
    pub principals_active_during_snapshot: u64,
}

impl_storable_minicbor!(ActivitySnapshot);

// ============================================================================
// LedgerAccount — our own Account type for stable memory maps.
// Uses minicbor for serialization, avoiding ic-stable-structures version
// conflicts with icrc_ledger_types::Account (which ships 0.6.x Storable
// while this workspace uses 0.7.x).
// ============================================================================

pub type Subaccount = [u8; 32];
pub const DEFAULT_SUBACCOUNT: Subaccount = [0u8; 32];

#[derive(CandidType, Serialize, Deserialize, Clone, Copy, Debug, Encode, Decode)]
pub struct LedgerAccount {
    #[cbor(n(0), with = "crate::cbor::principal")]
    pub owner: Principal,
    #[n(1)]
    pub subaccount: Option<Subaccount>,
}

impl LedgerAccount {
    pub fn new(owner: Principal, subaccount: Option<Subaccount>) -> Self {
        Self { owner, subaccount }
    }

    /// Effective subaccount (treats None as the default all-zeros subaccount).
    pub fn effective_subaccount(&self) -> &Subaccount {
        self.subaccount.as_ref().unwrap_or(&DEFAULT_SUBACCOUNT)
    }
}

impl PartialEq for LedgerAccount {
    fn eq(&self, other: &Self) -> bool {
        self.owner == other.owner && self.effective_subaccount() == other.effective_subaccount()
    }
}

impl Eq for LedgerAccount {}

impl std::hash::Hash for LedgerAccount {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.owner.hash(state);
        self.effective_subaccount().hash(state);
    }
}

impl PartialOrd for LedgerAccount {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for LedgerAccount {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.owner.cmp(&other.owner).then_with(|| {
            self.effective_subaccount()
                .cmp(other.effective_subaccount())
        })
    }
}

impl From<icrc_ledger_types::icrc1::account::Account> for LedgerAccount {
    fn from(a: icrc_ledger_types::icrc1::account::Account) -> Self {
        Self {
            owner: a.owner,
            subaccount: a.subaccount,
        }
    }
}

impl From<LedgerAccount> for icrc_ledger_types::icrc1::account::Account {
    fn from(a: LedgerAccount) -> Self {
        Self {
            owner: a.owner,
            subaccount: a.subaccount,
        }
    }
}

impl From<Principal> for LedgerAccount {
    fn from(p: Principal) -> Self {
        Self {
            owner: p,
            subaccount: None,
        }
    }
}

impl_storable_minicbor!(LedgerAccount);

// ============================================================================
// AccountDayKey — composite key for daily history
// ============================================================================

/// Composite key: (LedgerAccount, DayNumber).
/// Sorts by owner first → subaccount → day, so range queries for all
/// subaccounts of a principal are contiguous.
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Encode, Decode)]
pub struct AccountDayKey {
    #[n(0)]
    pub account: LedgerAccount,
    #[n(1)]
    pub day: DayNumber,
}

impl_storable_minicbor!(AccountDayKey);

// ============================================================================
// Heap-resident types (serialized via serde for upgrade, not in stable maps)
// ============================================================================

#[derive(
    CandidType, Deserialize, Serialize, Clone, Default, Debug, PartialEq, Eq, Encode, Decode,
)]
pub struct ProcessedTX {
    #[n(0)]
    pub block: BlockNumber,
    #[n(2)]
    pub tx_type: String,
    #[n(3)]
    pub from_account: String,
    #[n(4)]
    pub to_account: String,
    #[cbor(n(5), with = "crate::cbor::u128")]
    pub tx_value: TokenAmount,
    #[cbor(n(6), with = "crate::cbor::u128::option")]
    pub tx_fee: Option<TokenAmount>,
    #[n(7)]
    pub spender: Option<String>,
    #[n(8)]
    pub tx_time: TimestampNanos,
}

impl_storable_minicbor!(ProcessedTX);

impl fmt::Display for ProcessedTX {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Block: {}\nType: {}\nFrom: {}\nTo: {}\nValue: {}\nTime: {}",
            self.block,
            self.tx_type,
            self.from_account,
            self.to_account,
            self.tx_value,
            self.tx_time
        )
    }
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub enum TransactionType {
    #[default]
    Transfer,
    Mint,
    Burn,
    Approve,
}

impl TransactionType {
    pub fn as_str(&self) -> &str {
        match self {
            TransactionType::Transfer => "Transfer",
            TransactionType::Mint => "Mint",
            TransactionType::Burn => "Burn",
            TransactionType::Approve => "Approve",
        }
    }
}

impl fmt::Display for TransactionType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(CandidType, Debug, Serialize, Deserialize, Clone)]
pub struct SmallTX {
    pub block: BlockNumber,
    pub time: TimestampNanos,
    pub from: Option<LedgerAccount>,
    pub to: Option<LedgerAccount>,
    pub tx_type: TransactionType,
    pub value: TokenAmount,
    pub fee: Option<TokenAmount>,
}

impl fmt::Display for SmallTX {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Block: {}\nTime: {}\nFrom: {:?}\nTo: {:?}\nType: {}\nValue: {}\nFee: {:?}",
            self.block, self.time, self.from, self.to, self.tx_type, self.value, self.fee
        )
    }
}

pub const MAX_BLOCKS_RETAINED: usize = 20_000;
pub const MAX_TOTAL_DOWNLOAD: usize = 10_000;
pub const MAX_TRANSACTION_BATCH_SIZE: usize = 1_000;
pub const HOUR_AS_NANOS: u64 = 3_600_000_000_000;
pub const DAY_AS_NANOS: u64 = 86_400_000_000_000;
pub const STATS_RETURN_LENGTH: usize = 25;
pub const SECONDS_IN_ONE_YEAR: u64 = 86400 * 365;

// Block cache configuration — the actual transactions are stored in
// StableBTreeMap<BlockNumber, ProcessedTX> (memory region 10), keyed by block number.
#[derive(CandidType, Deserialize, Serialize, Default, Clone)]
pub struct BlockCacheConfig {
    pub tip: BlockNumber,
    pub hours_nano: u64,
    pub days_nano: u64,
}

#[derive(CandidType, Debug, Default, Serialize, Deserialize, Clone)]
pub struct TimeChunkStats {
    pub start_time: TimestampNanos,
    pub end_time: TimestampNanos,
    pub total_count: u64,
    pub mint_count: u64,
    pub transfer_count: u64,
    pub burn_count: u64,
    pub approve_count: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct TimeStats {
    pub total_transaction_count: u128,
    pub total_transaction_value: u128,
    pub total_transaction_average: f64,
    pub total_unique_accounts: u64,
    pub total_unique_principals: u64,
    pub most_active_accounts: Vec<(String, u64)>,
    pub most_active_principals: Vec<(String, u64)>,
    pub burn_stats: TotCntAvg,
    pub mint_stats: TotCntAvg,
    pub transfer_stats: TotCntAvg,
    pub approve_stats: TotCntAvg,
    pub count_over_time: Vec<TimeChunkStats>,
    pub top_mints: Vec<ProcessedTX>,
    pub top_burns: Vec<ProcessedTX>,
    pub top_transfers: Vec<ProcessedTX>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct TotCntAvg {
    pub total_value: u128,
    pub count: u128,
    pub average: f64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct HolderBalanceResponse {
    pub holder: String,
    pub data: Overview,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Default, Debug)]
pub struct TotalHolderResponse {
    pub total_accounts: u64,
    pub total_principals: u64,
}

// Query arg types (matching super_stats_v3 Candid interface exactly)
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GetAccountHistoryArgs {
    pub account: String,
    pub days: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GetPrincipalHistoryArgs {
    pub account: String,
    pub days: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GetAccountHoldersArgs {
    pub offset: u64,
    pub limit: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct GetPrincipalHoldersArgs {
    pub offset: u64,
    pub limit: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct TargetArgs {
    pub target_ledger: String,
    pub hourly_size: u8,
    pub daily_size: u8,
}

// InitLedgerArgs no longer requires IndexerType — ICRC2 only.
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct InitLedgerArgs {
    pub target: TargetArgs,
}

// Working stats for indexer progress tracking
#[derive(CandidType, Deserialize, Serialize, Default, Clone, Debug)]
pub struct WorkingStats {
    pub timer_active: bool,
    pub is_busy: bool,
    pub next_block: BlockNumber,
    pub ledger_tip_of_chain: BlockNumber,
    pub is_upto_date: bool,
    /// Repurposed: now holds total account count (was directory ref count).
    pub directory_count: u64,
    pub last_update_time: TimestampNanos,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum StatsType {
    Hourly,
    Daily,
}

// Heap-resident ledger indexer config & stats (serialized with the rest of Data on upgrade).
// Actual transaction data lives in stable memory maps.
#[derive(Serialize, Deserialize, Default, Clone)]
pub struct LedgerIndexerData {
    pub target_ledger: String,
    pub target_ledger_locked: bool,
    pub ledger_fee: TokenAmount,
    pub ledger_decimals: u8,
    pub block_cache_config: BlockCacheConfig,
    pub hourly_stats: TimeStats,
    pub daily_stats: TimeStats,
    pub working_stats: WorkingStats,
    pub max_return_length: usize,
    // Activity tracking working state
    pub activity_chunk_start_time: TimestampNanos,
    pub activity_chunk_end_time: TimestampNanos,
    pub activity_accounts_count: u64,
    pub activity_principals_count: u64,
}

// ============================================================================
// ICRC2 Candid types for fetching transactions from the ledger
// ============================================================================

pub const DEFAULT_SUBACCOUNT_HEX: &str =
    "0000000000000000000000000000000000000000000000000000000000000000";

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcrcAccount {
    pub owner: candid::Principal,
    pub subaccount: Option<Vec<u8>>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct GetBlocksArgs1 {
    pub start: candid::Nat,
    pub length: candid::Nat,
}

#[derive(CandidType, Deserialize)]
pub struct GetTransactionsResponse {
    pub first_index: candid::Nat,
    pub log_length: candid::Nat,
    pub transactions: Vec<IcrcTransaction>,
    pub archived_transactions: Vec<ArchivedRange1>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcrcTransaction {
    pub burn: Option<IcrcBurn>,
    pub kind: String,
    pub mint: Option<IcrcMint>,
    pub approve: Option<IcrcApprove>,
    pub timestamp: u64,
    pub transfer: Option<IcrcTransfer>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcrcBurn {
    pub from: IcrcAccount,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: candid::Nat,
    pub spender: Option<IcrcAccount>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcrcMint {
    pub to: IcrcAccount,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: candid::Nat,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcrcApprove {
    pub fee: Option<candid::Nat>,
    pub from: IcrcAccount,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: candid::Nat,
    pub expected_allowance: Option<candid::Nat>,
    pub expires_at: Option<u64>,
    pub spender: IcrcAccount,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct IcrcTransfer {
    pub to: IcrcAccount,
    pub fee: Option<candid::Nat>,
    pub from: IcrcAccount,
    pub memo: Option<Vec<u8>>,
    pub created_at_time: Option<u64>,
    pub amount: candid::Nat,
    pub spender: Option<IcrcAccount>,
}

candid::define_function!(pub ArchivedRange1Callback : (GetBlocksArgs1) -> (
    TransactionRange,
) query);

#[derive(CandidType, Deserialize)]
pub struct ArchivedRange1 {
    pub callback: ArchivedRange1Callback,
    pub start: candid::Nat,
    pub length: candid::Nat,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransactionRange {
    pub transactions: Vec<IcrcTransaction>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use candid::Principal;
    use ic_stable_structures::storable::Storable;

    fn make_account(principal_bytes: &[u8], subaccount: [u8; 32]) -> LedgerAccount {
        LedgerAccount {
            owner: Principal::from_slice(principal_bytes),
            subaccount: Some(subaccount),
        }
    }

    #[test]
    fn test_overview_round_trip() {
        let original = Overview {
            first_active: 1000,
            last_active: 2000,
            sent_count: 5,
            sent_value: 500_000_000_000_000,
            received_count: 10,
            received_value: 1_000_000_000_000_000,
            balance: 500_000_000_000_000,
            max_balance: 1_000_000_000_000_000,
        };
        let bytes = original.to_bytes();
        let decoded = Overview::from_bytes(bytes);
        assert_eq!(original, decoded);
    }

    #[test]
    fn test_overview_large_u128() {
        let original = Overview {
            first_active: 0,
            last_active: u64::MAX,
            sent_count: u32::MAX,
            sent_value: u128::MAX,
            received_count: 0,
            received_value: u128::MAX / 2,
            balance: u128::MAX,
            max_balance: u128::MAX,
        };
        let bytes = original.to_bytes();
        let decoded = Overview::from_bytes(bytes);
        assert_eq!(original, decoded);
    }

    #[test]
    fn test_history_data_round_trip() {
        let original = HistoryData {
            balance: 123_456_789_000_000_000,
        };
        let bytes = original.to_bytes();
        let decoded = HistoryData::from_bytes(bytes);
        assert_eq!(original, decoded);
    }

    #[test]
    fn test_history_balance_cache_round_trip() {
        let original = HistoryBalanceCache {
            day: 19500,
            data: HistoryData {
                balance: 999_999_999,
            },
        };
        let bytes = original.to_bytes();
        let decoded = HistoryBalanceCache::from_bytes(bytes);
        assert_eq!(original, decoded);
    }

    #[test]
    fn test_activity_snapshot_round_trip() {
        let original = ActivitySnapshot {
            start_time: 1_000_000_000_000,
            end_time: 1_086_400_000_000_000,
            total_unique_accounts: 5000,
            total_unique_principals: 3000,
            accounts_active_during_snapshot: 200,
            principals_active_during_snapshot: 150,
        };
        let bytes = original.to_bytes();
        let decoded = ActivitySnapshot::from_bytes(bytes);
        assert_eq!(original, decoded);
    }

    #[test]
    fn test_account_day_key_round_trip() {
        let account = make_account(&[0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [0u8; 32]);
        let original = AccountDayKey {
            account,
            day: 19500,
        };
        let bytes = original.to_bytes();
        let decoded = AccountDayKey::from_bytes(bytes);
        assert_eq!(original, decoded);
    }

    #[test]
    fn test_account_day_key_ordering_same_account_different_day() {
        let account = make_account(&[0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [0u8; 32]);
        let key1 = AccountDayKey { account, day: 100 };
        let key2 = AccountDayKey { account, day: 200 };
        assert!(key1 < key2);
    }

    #[test]
    fn test_account_day_key_ordering_different_principal() {
        let account_a = make_account(&[0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [0u8; 32]);
        let account_b = make_account(&[0, 0, 0, 0, 0, 0, 0, 0, 0, 2], [0u8; 32]);
        let key_a = AccountDayKey {
            account: account_a,
            day: 999,
        };
        let key_b = AccountDayKey {
            account: account_b,
            day: 1,
        };
        // Different principals: ordering determined by principal, not day
        assert!(key_a < key_b);
    }

    #[test]
    fn test_account_day_key_ordering_same_principal_different_subaccount() {
        let mut sub_a = [0u8; 32];
        sub_a[31] = 1;
        let mut sub_b = [0u8; 32];
        sub_b[31] = 2;
        let principal_bytes = &[0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
        let account_a = make_account(principal_bytes, sub_a);
        let account_b = make_account(principal_bytes, sub_b);
        let key_a = AccountDayKey {
            account: account_a,
            day: 100,
        };
        let key_b = AccountDayKey {
            account: account_b,
            day: 100,
        };
        // Same principal, different subaccount: sub_a < sub_b
        assert!(key_a < key_b);
    }

    #[test]
    fn test_processed_tx_round_trip() {
        let original = ProcessedTX {
            block: 12345,
            tx_type: "Transfer".to_string(),
            from_account: "abc-principal.00000000".to_string(),
            to_account: "def-principal.00000000".to_string(),
            tx_value: 1_000_000_000_000,
            tx_fee: Some(10_000),
            spender: None,
            tx_time: 1_700_000_000_000_000_000,
        };
        let bytes = original.to_bytes();
        let decoded = ProcessedTX::from_bytes(bytes);
        assert_eq!(original, decoded);
    }

    #[test]
    fn test_processed_tx_large_value() {
        let original = ProcessedTX {
            block: u64::MAX,
            tx_type: "Approve".to_string(),
            from_account: "x".repeat(134),
            to_account: "y".repeat(134),
            tx_value: u128::MAX,
            tx_fee: Some(u128::MAX),
            spender: Some("spender".to_string()),
            tx_time: 0,
        };
        let bytes = original.to_bytes();
        let decoded = ProcessedTX::from_bytes(bytes);
        assert_eq!(original, decoded);
    }

    #[test]
    fn test_overview_credit_debit() {
        let mut ov = Overview::default();
        ov.credit_account(100, 1000);
        assert_eq!(ov.balance, 1000);
        assert_eq!(ov.received_count, 1);
        assert_eq!(ov.received_value, 1000);
        assert_eq!(ov.max_balance, 1000);
        assert_eq!(ov.first_active, 100);

        ov.debit_account(200, 300, 10);
        assert_eq!(ov.balance, 690);
        assert_eq!(ov.sent_count, 1);
        assert_eq!(ov.sent_value, 310);
        assert_eq!(ov.last_active, 200);
    }

    #[test]
    fn test_overview_add() {
        let a = Overview {
            first_active: 100,
            last_active: 200,
            sent_count: 2,
            sent_value: 500,
            received_count: 3,
            received_value: 1000,
            balance: 500,
            max_balance: 1000,
        };
        let b = Overview {
            first_active: 50,
            last_active: 300,
            sent_count: 1,
            sent_value: 100,
            received_count: 2,
            received_value: 600,
            balance: 500,
            max_balance: 600,
        };
        let sum = a + b;
        assert_eq!(sum.first_active, 50);
        assert_eq!(sum.last_active, 300);
        assert_eq!(sum.sent_count, 3);
        assert_eq!(sum.sent_value, 600);
        assert_eq!(sum.received_count, 5);
        assert_eq!(sum.received_value, 1600);
        assert_eq!(sum.balance, 1000);
        assert_eq!(sum.max_balance, 1000);
    }
}
