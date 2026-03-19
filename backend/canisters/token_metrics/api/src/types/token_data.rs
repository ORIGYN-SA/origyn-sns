use std::ops::Add;

use candid::CandidType;
use minicbor::{Decode, Encode};
use serde::{Deserialize, Serialize};
use utils::consts::E8S_PER_OGY;

use super::ledger_indexer::Overview as LedgerOverview;
use crate::impl_storable_minicbor;

// ============================================================================
// Semantic type aliases — zero-cost, purely for readability
// ============================================================================

/// Basis points (e.g., 2600 = 26.00%)
pub type BasisPoints = u64;
/// Token amount in e8s (1 OGY = 10^8 e8s)
pub type StakeE8s = u128;
/// Voting power in e8s
pub type VotingPower = u64;
/// Number of proposals
pub type ProposalCount = u64;

// ============================================================================
// Data types
// ============================================================================

/// Token supply data from the ledger (total and circulating).
#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct TokenSupplyData {
    pub total_supply: candid::Nat,
    pub circulating_supply: candid::Nat,
}

/// Principal-level balance combining governance staking and ledger balance.
#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct PrincipalBalance {
    pub governance: GovernanceStats,
    pub ledger: StakeE8s,
}

/// Combined view of a wallet's ledger and governance holdings.
#[derive(Serialize, Deserialize, Clone, Default, CandidType, Encode, Decode)]
pub struct WalletOverview {
    /// Ledger-side overview (balance, sent/received counts, etc.)
    #[n(0)]
    pub ledger: LedgerOverview,
    /// Governance-side stats (staked, locked, unlocked, rewards)
    #[n(1)]
    pub governance: GovernanceStats,
    /// Total holdings across ledger + governance (in e8s)
    #[cbor(n(2), with = "crate::cbor::u128")]
    pub total: u128,
}

impl_storable_minicbor!(WalletOverview);

/// Aggregate governance statistics for a principal or the whole canister.
/// All token amounts are in e8s (1 OGY = 10^8 e8s).
#[derive(Serialize, Deserialize, Clone, Default, CandidType, Encode, Decode)]
pub struct GovernanceStats {
    /// Total tokens staked (locked + unlocked + restaked maturity)
    #[cbor(n(0), with = "crate::cbor::u128")]
    pub total_staked: StakeE8s,
    /// Tokens in locked neurons (non-zero dissolve delay)
    #[cbor(n(1), with = "crate::cbor::u128")]
    pub total_locked: StakeE8s,
    /// Tokens in unlocked neurons (zero dissolve delay or past dissolve timestamp)
    #[cbor(n(2), with = "crate::cbor::u128")]
    pub total_unlocked: StakeE8s,
    /// Accumulated rewards (staked maturity)
    #[cbor(n(3), with = "crate::cbor::u128")]
    pub total_rewards: StakeE8s,
}

/// Amount of locked tokens bucketed by dissolve delay period.
#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct LockedNeuronsAmount {
    pub one_year: StakeE8s,
    pub two_years: StakeE8s,
    pub three_years: StakeE8s,
    pub four_years: StakeE8s,
    pub five_years: StakeE8s,
}

/// Internal running totals used to compute `ProposalsMetrics` incrementally.
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct ProposalsMetricsCalculations {
    pub cumulative_voting_participation: f64,
    pub cumulative_voting_power: VotingPower,
    pub valid_tally_count: ProposalCount,
}

/// Internal running totals used to compute per-day voting participation.
#[derive(Serialize, Deserialize, Clone, Default, CandidType, Debug)]
pub struct VotingHistoryCalculations {
    pub cumulative_voting_participation: f64,
    pub valid_tally_count: ProposalCount,
}

/// Aggregated proposal and voting metrics across all proposals.
#[derive(Serialize, Deserialize, Clone, CandidType, Debug)]
pub struct ProposalsMetrics {
    /// Highest proposal ID seen
    pub total_proposals: ProposalCount,
    /// Daily voting rewards in e8s
    pub daily_voting_rewards: StakeE8s,
    /// Annual reward base for the current year in e8s
    pub reward_base_current_year: StakeE8s,
    /// Maximum total voting power observed in any single proposal tally
    pub total_voting_power: VotingPower,
    /// Average voting power across all proposals
    pub average_voting_power: VotingPower,
    /// Average voting participation in basis points (2600 = 26.00%)
    pub average_voting_participation: BasisPoints,
}

impl Default for ProposalsMetrics {
    fn default() -> Self {
        ProposalsMetrics {
            total_proposals: 0,
            reward_base_current_year: ANNUAL_REWARD_BASE_OGY * E8S_PER_OGY as u128,
            daily_voting_rewards: (ANNUAL_REWARD_BASE_OGY / 365) * E8S_PER_OGY as u128,
            total_voting_power: 0,
            average_voting_power: 0,
            average_voting_participation: 0,
        }
    }
}

/// Annual reward base in whole OGY tokens (before e8s conversion).
pub const ANNUAL_REWARD_BASE_OGY: u128 = 250_000_000;

/// Daily metrics tracking foundation voting power ratio and participation.
#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct DailyVotingMetrics {
    /// Foundation's voting power (e8s)
    pub org_voting_power: VotingPower,
    /// Total network voting power (e8s)
    pub total_voting_power: VotingPower,
    /// Voting participation in basis points
    pub voting_participation: BasisPoints,
}

impl Add for GovernanceStats {
    type Output = GovernanceStats;

    fn add(self, other: Self) -> Self::Output {
        GovernanceStats {
            total_staked: self.total_staked + other.total_staked,
            total_locked: self.total_locked + other.total_locked,
            total_unlocked: self.total_unlocked + other.total_unlocked,
            total_rewards: self.total_rewards + other.total_rewards,
        }
    }
}

#[derive(CandidType, Deserialize)]
pub struct GetHoldersArgs {
    pub offset: u64,
    pub limit: u64,
    pub merge_accounts_to_principals: bool,
}

/// Active user counts (users with > 0 OGY balance).
#[derive(CandidType, Deserialize, Serialize, Clone, Default)]
pub struct ActiveUsers {
    pub active_accounts_count: usize,
    pub active_principals_count: usize,
}
