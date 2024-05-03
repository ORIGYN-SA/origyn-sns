use candid::{CandidType, Nat};
use ic_stable_memory::{derive::{StableType, AsFixedSizeBytes}, collections::{SBTreeMap, SVec}};
use num_bigint::BigUint;
use serde::{Deserialize, Serialize};

use crate::core::{runtime::RUNTIME_STATE, utils::log, stable_memory::Main, types::IDKey};

use super::custom_types::{SmallTX, ProcessedTX};

// Stable Store of account indexed data
#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct AccountTree{
    pub accounts: SBTreeMap<u64, Overview>,
    count: u64, // not used
    last_updated: u64, // not used
}
impl AccountTree {

    pub fn process_transfer_to(&mut self, account_ref: &u64, stx: &SmallTX) -> Result<String, String> {
      if !self.accounts.contains_key(account_ref) {
         let acd = Overview { 
                  first_active: stx.time, 
                  last_active: stx.time, 
                  sent: (0_u32, 0_u128), 
                  received: (1_u32, stx.value), 
                  balance: stx.value 
               };

         self.accounts.insert(*account_ref, acd).expect("Storage is full");
         return Ok("Transfer Processed".to_string())

      } else if let Some(mut ac) = self.accounts.get_mut(account_ref) {
         ac.credit_account(stx.time, stx.value);
        
         return Ok("Transfer Processed".to_string())
      } else {
        let error = 
        format!("Error - cannot process transfer to, Block: {}", stx);
        return Err(error);
      }
    }

    pub fn process_transfer_from(&mut self, account_ref: &u64, stx: &SmallTX ) -> Result<String, String> {
        match self.accounts.get_mut(account_ref) {
            Some(mut ac) => {
                let fee: u128;
                if let Some(f) = stx.fee { fee = f } else {
                  fee = RUNTIME_STATE.with(|s|{s.borrow().data.get_ledger_fee()})
                };
                ac.debit_account(stx.time, stx.value, fee);
                return Ok("Processed OK".to_string());
            },
            None => { 
               let error = 
               format!("Error - cannot send from a non-existent account (process_transfer_from), Block: {}", stx);
               return Err(error);
            },
        }
    }

    pub fn process_approve_from(&mut self, account_ref: &u64, stx: &SmallTX ) -> Result<String, String> {
        match self.accounts.get_mut(account_ref) {
            Some(mut ac) => {
               let fee: u128;
               if let Some(f) = stx.fee { fee = f } else {
                 fee = RUNTIME_STATE.with(|s|{s.borrow().data.get_ledger_fee()})
               };
                ac.debit_account(stx.time, 0, fee);
                return Ok("Approve Processed".to_string());
            },
            None => { return Err("Error - cannot send from a non-existent account (process_approve_from)".to_string())},
        }
    }
}

#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct AccountData {
    pub overview: Overview
 }

 #[derive(CandidType, StableType, Deserialize, Serialize, Clone, Default, AsFixedSizeBytes, Debug)]
 pub struct Overview {
    pub first_active: u64,
    pub last_active: u64,
    pub sent: (u32, u128), // count, value
    pub received: (u32, u128), // count, value
    pub balance: u128,
 }
 impl Overview {
    pub fn debit_account(&mut self, time:u64, value: u128, tx_fee: u128){
        if self.first_active == 0 || time < self.first_active { self.first_active = time }
        if self.last_active < time { self.last_active = time }

        // update balances
        let total_deduction = value.saturating_add(tx_fee);
        self.balance = self.balance.saturating_sub(total_deduction);
        let (mut s1, mut s2) = self.sent;
        s1 += 1;
        s2 = s2.saturating_add(total_deduction);
        self.sent = (s1,s2);
    }

    pub fn credit_account(&mut self, time:u64, value: u128){
        if self.first_active == 0 || time < self.first_active { self.first_active = time }
        if self.last_active < time {self.last_active = time}

        // update balances
        self.balance = self.balance.saturating_add(value);
        let (mut r1, mut r2) = self.received;
        r1 += 1;
        r2 = r2.saturating_add(value);
        self.received = (r1,r2);
    }
 }

 // IMPL 
 impl Main {
    pub fn get_overview_by_id(&self, id_string: &String) -> Option<Overview> {
        match self.directory_data.get_ref(id_string) {
            Some(ref_value) => {
                match self.account_data.accounts.get(&ref_value) {
                    Some(ac_value) => { 
                        let ov = Overview{
                            first_active: ac_value.first_active,
                            last_active: ac_value.last_active,
                            sent: ac_value.sent,
                            received: ac_value.received,
                            balance: ac_value.balance,
                        };
                        return Some(ov);
                    },
                    None => {return None}
                }
            },
            None => { return None },
        } 
    }

    pub fn get_overview_by_ref(&self, id_ref: &u64) -> Option<Overview> {
        match self.account_data.accounts.get(&id_ref) {
            Some(ac_value) => { 
                let ov = Overview{
                    first_active: ac_value.first_active,
                    last_active: ac_value.last_active,
                    sent: ac_value.sent,
                    received: ac_value.received,
                    balance: ac_value.balance,
                };
                return Some(ov);
            },
            None => {return None}
        }
    }
}