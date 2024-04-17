use candid::Principal;
use serde::{ Deserialize, Serialize };

#[derive(Serialize, Deserialize, Default)]
pub struct DepositPrincipals {
    list: Vec<Principal>,
}

impl DepositPrincipals {
    pub fn insert(&mut self, p: Principal) {
        if !self.list.contains(&p) {
            self.list.push(p);
        }
    }

    pub fn get(&self) -> Vec<Principal> {
        self.list.clone()
    }
}
