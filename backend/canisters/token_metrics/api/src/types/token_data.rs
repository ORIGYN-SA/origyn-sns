use std::ops::Add;

use candid::{ CandidType, Nat };
use serde::{ Deserialize, Serialize };
use super_stats_v3_c2c_client::helpers::account_tree::Overview as LedgerOverview;

#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct TokenSupplyData {
    pub total_supply: Nat,
    pub circulating_supply: Nat,
}

#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct PrincipalBalance {
    pub governance: GovernanceStats,
    pub ledger: u64,
}
#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct WalletOverview {
    pub ledger: LedgerOverview,
    pub governance: GovernanceStats,
    pub total: u64,
}

#[derive(Serialize, Deserialize, Clone, Default, CandidType)]
pub struct GovernanceStats {
    pub total_staked: Nat,
    pub total_locked: Nat,
    pub total_unlocked: Nat,
    pub total_rewards: Nat,
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
