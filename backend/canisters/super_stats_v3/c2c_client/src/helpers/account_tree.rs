use std::ops::Add;

use candid::{ CandidType };
use ic_stable_memory::{ derive::{ StableType, AsFixedSizeBytes }, collections::{ SBTreeMap } };
use serde::{ Deserialize, Serialize };

// Stable Store of account indexed data
#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct AccountTree {
    pub accounts: SBTreeMap<u64, Overview>,
    count: u64, // not used
    last_updated: u64, // not used
}

#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct AccountData {
    pub overview: Overview,
}

#[derive(
    CandidType,
    StableType,
    Deserialize,
    Serialize,
    Clone,
    Copy,
    Default,
    AsFixedSizeBytes,
    Debug
)]
pub struct Overview {
    pub first_active: u64,
    pub last_active: u64,
    pub sent: (u32, u128),
    pub received: (u32, u128),
    pub balance: u128,
}

impl Add for Overview {
    type Output = Overview;

    fn add(self, other: Self) -> Self::Output {
        let (sent_count1, sent_amount1) = self.sent;
        let (sent_count2, sent_amount2) = other.sent;
        let (received_count1, received_amount1) = self.received;
        let (received_count2, received_amount2) = other.received;

        Overview {
            first_active: self.first_active.min(other.first_active),
            last_active: self.last_active.max(other.last_active),
            sent: (sent_count1 + sent_count2, sent_amount1 + sent_amount2),
            received: (received_count1 + received_count2, received_amount1 + received_amount2),
            balance: self.balance + other.balance,
        }
    }
}
