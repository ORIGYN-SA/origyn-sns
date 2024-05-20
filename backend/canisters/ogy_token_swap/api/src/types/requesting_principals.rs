use std::collections::HashSet;

use candid::Principal;
use serde::{ Deserialize, Serialize };

use crate::updates::request_deposit_account::Response;

#[derive(Serialize, Deserialize, Default)]
pub struct RequestingPrincipals {
    list: HashSet<Principal>,
}

pub const LIST_MAX_LIMIT: usize = 1_000_000;

impl RequestingPrincipals {
    pub fn insert(&mut self, p: Principal) -> Result<(), Response> {
        if self.list.len() >= LIST_MAX_LIMIT {
            return Err(Response::MaxCapacityOfListReached);
        }
        self.list.insert(p);
        Ok(())
    }

    pub fn list(&self) -> HashSet<Principal> {
        self.list.clone()
    }

    pub fn contains(&self, p: &Principal) -> bool {
        self.list.contains(p)
    }
}
