use candid::{CandidType, Nat};
use ic_stable_memory::{derive::{StableType, AsFixedSizeBytes}, collections::{SBTreeMap, SVec}};
use num_bigint::BigUint;
use serde::{Deserialize, Serialize};

use crate::core::{runtime::RUNTIME_STATE, utils::log, stable_memory::Main, types::IDKey};

use super::{custom_types::{FullDataResponse, FullDataResponseRaw, IndexerType, LinkDataResponse, ProcessedTX, SmallTX}, constants::MAX_LINKED_ACS_TO_RETURN};

// Stable Store of account indexed data
#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct AccountTree{
    pub accounts: SBTreeMap<u64, AccountData>,
    count: u64,
    last_updated: u64,
}
impl AccountTree {

    pub fn process_transfer_to(&mut self, account_ref: &u64, stx: &SmallTX) -> Result<String, String> {
      if !self.accounts.contains_key(account_ref) {
         let acd = AccountData {
               overview: Overview { 
                  first_active: stx.time, 
                  last_active: stx.time, 
                  sent: (0_u32, 0_u128), 
                  received: (1_u32, stx.value), 
                  balance: stx.value 
               },
               data: IndexData::default(),
         };
         self.accounts.insert(*account_ref, acd).expect("Storage is full");
         return Ok("Transfer Processed".to_string())
      } else if let Some(mut ac) = self.accounts.get_mut(account_ref) {
         ac.overview.credit_account(stx.time, stx.value);
         return Ok("Transfer Processed".to_string())
      } else {
         return Err("Cannot process transfer to".to_string())
      }
    }

    pub fn process_transfer_from(&mut self, account_ref: &u64, stx: &SmallTX ) -> Result<String, String> {
        match self.accounts.get_mut(account_ref) {
            Some(mut ac) => {
                let fee: u128;
                if let Some(f) = stx.fee { fee = f } else {
                  fee = RUNTIME_STATE.with(|s|{s.borrow().data.get_ledger_fee()})
                };
                ac.overview.debit_account(stx.time, stx.value, fee);
                return Ok("Processed OK".to_string());
            },
            None => { 
                let error = 
                format!("Error - cannot send from a non-existent account (process_transfer_from), Block: {:?}", stx);
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
                ac.overview.debit_account(stx.time, 0, fee);
                return Ok("Approve Processed".to_string());
            },
            None => { return Err("Error - cannot send from a non-existent account (process_approve_from)".to_string())},
        }
    }

    // only call this after process transfers - this ensures links/ blocks are init.. NEEDED??
    // ** direction 1 = inbound (ie account_ref is to) -1 = outbound (ie account_ref is from) ** IMPORTANT! 
    pub fn process_links(&mut self, account_ref: &u64, linked_ref: &u64, direction: i8, stx: &SmallTX ) -> Result<String, String> {
        match self.accounts.get_mut(account_ref) {
            Some(mut ac) => {
                match ac.data.update_links(linked_ref,  direction, stx) {
                  Ok(_v) => { return Ok("Links Updated".to_string())},
                  Err(e) => { return Err(e) }
                }
            },
            None => { 
                return Err("Error - Cannot find account to update links".to_string());  
            },
        }
    }

    pub fn process_block(&mut self, account_ref: &u64, block_ref: u64) -> Result<String, String> {
        match self.accounts.get_mut(account_ref) {
            Some(mut ac) => {
                ac.data.update_blocks(block_ref);
                return Ok("Blocks Updated".to_string());
            },
            None => { 
                return Err("Error - Cannot find account to update blocks".to_string())
            },
        }
    }
}

#[derive(StableType, AsFixedSizeBytes, Debug, Default)]
pub struct AccountData {
    pub overview: Overview,
    pub data: IndexData,
 }

 #[derive(StableType, Default, AsFixedSizeBytes, Debug)]
 pub struct IndexData {
    pub links: SBTreeMap<u64, LinkData>,
    pub blocks: SVec<u64>
 }

 impl IndexData {
    // call this after transfer to or transfer from, to ensure account + indexData is created
    pub fn update_links(&mut self, linked_ref: &u64, direction: i8, stx: &SmallTX) -> Result<String, String> {
      match self.links.contains_key(linked_ref){
         true => {
             match self.links.get_mut(linked_ref) {
                 Some(mut v) => {
                     v.update(stx.time, *linked_ref, stx.value, direction);
                     return Ok("Links Updated".to_string());
                 },
                 // should never get here as contains_key called first. 
                 // have to call contains key to avoid double mut borrow of self.
                 None => {return Err("Update Links (error 1)".to_string());} 
             }
         },
         false => {
             // insert new
             let calc_net: i128 = if direction == 1 { stx.value as i128 } else { stx.value as i128 *-1 };
             let ld = LinkData{
                 linked_from: stx.time,
                 linked_id: *linked_ref,
                 number_txs: 1_u32,
                 gross: stx.value,
                 net: calc_net,
             };
             self.links.insert(*linked_ref, ld).expect("Storage is full");
             return Ok("Links Updated".to_string());
         }
      }
    }

    pub fn update_blocks(&mut self, block_ref: u64) {
        self.blocks.push(block_ref).expect("Storage is full");
    }

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

 #[derive(CandidType, StableType, Deserialize, Serialize, Clone, Default, AsFixedSizeBytes, Debug, PartialEq, Eq)]
 pub struct LinkData {
    pub linked_from: u64,
    pub linked_id: u64,
    pub number_txs: u32,
    pub gross: u128,
    pub net: i128
 }
 impl LinkData {
    pub fn update (&mut self, time: u64, linked_id: u64, value: u128, direction: i8) {  
      self.linked_from = if self.linked_from == 0 || time < self.linked_from { time } else { self.linked_from };
      self.linked_id = linked_id;
      self.gross = self.gross.saturating_add(value);
      self.number_txs += 1;
      if direction == 1 { self.net += value as i128 } 
      else if direction == -1 { self.net -= value as i128 }
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
                            first_active: ac_value.overview.first_active,
                            last_active: ac_value.overview.last_active,
                            sent: ac_value.overview.sent,
                            received: ac_value.overview.received,
                            balance: ac_value.overview.balance,
                        };
                        return Some(ov);
                    },
                    None => {return None}
                }
            },
            None => { return None },
        } 
    }

    pub fn get_transactions_by_id(&self, id_string: &String) -> Option<Vec<u64>> {
        match self.directory_data.get_ref(id_string) {
            Some(ref_value) => {
                match self.account_data.accounts.get(&ref_value) {
                    Some(ac_value) => { 
                        let mut ret: Vec<u64> = Vec::new();
                        for tx in ac_value.data.blocks.iter() {
                            ret.push(*tx);
                        }
                        return Some(ret);
                    },
                    None => {return None}
                }
            },
            None => { return None },
        } 
    }
    
    pub fn get_fulldata_by_id_raw(&self, id_string: &String) -> Option<FullDataResponseRaw> {
        match self.directory_data.get_ref(id_string) {
            Some(ref_value) => {
                match self.account_data.accounts.get(&ref_value) {
                    Some(ac_value) => { 
                        let ov = Overview{
                            first_active: ac_value.overview.first_active,
                            last_active: ac_value.overview.last_active,
                            sent: ac_value.overview.sent,
                            received: ac_value.overview.received,
                            balance: ac_value.overview.balance,
                        };
                        let mut links:Vec<LinkData> = Vec::new();
                        for ld in ac_value.data.links.iter() {
                            let ld2 = LinkData{
                                linked_from: ld.1.linked_from,
                                linked_id: ld.1.linked_id,
                                number_txs: ld.1.number_txs,
                                gross: ld.1.gross,
                                net: ld.1.net,
                            };
                            links.push(ld2);  
                        }
                        let mut blocks:Vec<u64> = Vec::new();
                        for bd in ac_value.data.blocks.iter() {
                            blocks.push(*bd);
                        }
                        let res = FullDataResponseRaw{
                            account_ref: ref_value,
                            overview: ov,
                            links,
                            blocks,
                        };
                        return Some(res);
                    },
                    None => {return None}
                }
            },
            None => { return None }
        }
    }

    pub fn get_fulldata_by_id(&self, id_string: &String) -> Option<FullDataResponse> {
        let ac_idkey = IDKey::from_string(&id_string);
        match self.directory_data.get_ref(id_string) {
            Some(ref_value) => {
                match self.account_data.accounts.get(&ref_value) {
                    Some(ac_value) => { 
                        let ov = Overview{
                            first_active: ac_value.overview.first_active,
                            last_active: ac_value.overview.last_active,
                            sent: ac_value.overview.sent,
                            received: ac_value.overview.received,
                            balance: ac_value.overview.balance,
                        };
                        let mut links:Vec<LinkDataResponse> = Vec::new();
                        for ld in ac_value.data.links.iter() {
                            match self.directory_data.get_id(&ld.1.linked_id) {
                                Some(id_string) => {
                                    let ld2 = LinkDataResponse{
                                        linked_from: ld.1.linked_from,
                                        linked_id: id_string,
                                        number_txs: ld.1.number_txs,
                                        gross: ld.1.gross,
                                        net: ld.1.net,
                                    };
                                    links.push(ld2);  
                                }
                                None => {
        
                                }
                            }   
                        }

                        // trim links if too many
                        if links.len() > MAX_LINKED_ACS_TO_RETURN { links.truncate(MAX_LINKED_ACS_TO_RETURN); }

                        let blocks:Vec<ProcessedTX> = Vec::new(); // fetch + process in follow up call. 
                        let res = FullDataResponse{
                            account_ref: id_string.clone(),
                            overview: ov,
                            links,
                            blocks,
                        };
                        return Some(res);
                    },
                    None => {return None}
                }
            },
            None => { return None }
        }
    }

    pub fn get_overview_by_ref(&self, id_ref: &u64) -> Option<Overview> {
        match self.account_data.accounts.get(&id_ref) {
            Some(ac_value) => { 
                let ov = Overview{
                    first_active: ac_value.overview.first_active,
                    last_active: ac_value.overview.last_active,
                    sent: ac_value.overview.sent,
                    received: ac_value.overview.received,
                    balance: ac_value.overview.balance,
                };
                return Some(ov);
            },
            None => {return None}
        }
    }

    pub fn get_transactions_by_ref(&self, id_ref: &u64) -> Option<Vec<u64>> {
        match self.account_data.accounts.get(&id_ref) {
            Some(ac_value) => { 
                let mut ret: Vec<u64> = Vec::new();
                for tx in ac_value.data.blocks.iter() {
                    ret.push(*tx);
                }
                return Some(ret);
            },
            None => {return None}
        }
    }

    // linked acs/ blocks as refs not decoded to account string.
    pub fn get_fulldata_by_ref_raw(&self, id_ref: &u64) -> Option<FullDataResponseRaw> {
        match self.account_data.accounts.get(&id_ref) {
            Some(ac_value) => { 
                let ov = Overview{
                    first_active: ac_value.overview.first_active,
                    last_active: ac_value.overview.last_active,
                    sent: ac_value.overview.sent,
                    received: ac_value.overview.received,
                    balance: ac_value.overview.balance,
                };
                let mut links:Vec<LinkData> = Vec::new();
                for ld in ac_value.data.links.iter() {
                    let ld2 = LinkData{
                        linked_from: ld.1.linked_from,
                        linked_id: ld.1.linked_id,
                        number_txs: ld.1.number_txs,
                        gross: ld.1.gross,
                        net: ld.1.net,
                    };
                    links.push(ld2);  
                }
                let mut blocks:Vec<u64> = Vec::new();
                for bd in ac_value.data.blocks.iter() {
                    blocks.push(*bd);
                }
                let res = FullDataResponseRaw{
                    account_ref: id_ref.clone(),
                    overview: ov,
                    links,
                    blocks,
                };
                return Some(res);
            },
            None => {return None}
        }
    }

    // blocks need to be fetched in follow up call to block-store and processed. 
    pub fn get_fulldata_by_ref(&self, id_ref: &u64) -> Option<FullDataResponse> {
        match self.account_data.accounts.get(&id_ref) {
            Some(ac_value) => { 
                let ov = Overview{
                    first_active: ac_value.overview.first_active,
                    last_active: ac_value.overview.last_active,
                    sent: ac_value.overview.sent,
                    received: ac_value.overview.received,
                    balance: ac_value.overview.balance,
                };
                let mut links:Vec<LinkDataResponse> = Vec::new();
                for ld in ac_value.data.links.iter() {
                    match self.directory_data.get_id(&ld.1.linked_id) {
                        Some(id_string) => {
                            let ld2 = LinkDataResponse{
                                linked_from: ld.1.linked_from,
                                linked_id: id_string,
                                number_txs: ld.1.number_txs,
                                gross: ld.1.gross,
                                net: ld.1.net,
                            };
                            links.push(ld2);  
                        }
                        None => {

                        }
                    }   
                }

                // trim links if too many
                if links.len() > MAX_LINKED_ACS_TO_RETURN { links.truncate(MAX_LINKED_ACS_TO_RETURN); }
                
                match self.directory_data.get_id(&id_ref) {
                    Some(ac_string) => {
                        let blocks:Vec<ProcessedTX> = Vec::new(); // fetch blocks in follow up call to block-store. 
                        let res = FullDataResponse{
                            account_ref: ac_string,
                            overview: ov,
                            links,
                            blocks,
                        };
                        return Some(res);
                    },
                    None => { return None; },
                }
            },
            None => {return None}
        }
    }
}