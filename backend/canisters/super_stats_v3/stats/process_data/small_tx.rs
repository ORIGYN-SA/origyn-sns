use crate::{
    stats::{custom_types::{ProcessedTX, SmallTX}, directory::add_to_directory, utils::parse_icrc_account}, core::utils::log
};

pub fn processedtx_to_smalltx(input_vec: &Vec<ProcessedTX>) -> Vec<SmallTX> {
    let mut stx:Vec<SmallTX> = Vec::new();
    for tx in input_vec {
        // get refs for from/ to accounts
        let fm: Option<u64>;
        let fm_ac = tx.from_account.as_str();
        if  fm_ac != "Token Ledger" 
        {
            fm = add_to_directory(&tx.from_account);
        } else { fm = None };

        let to: Option<u64>;
        let to_ac = tx.to_account.as_str();
        if  to_ac != "Token Ledger" 
        {
            to = add_to_directory(&tx.to_account);
        } else { to = None };

        let fee: Option<u128>;
        if let Some(fee_value) = tx.tx_fee.clone() { fee = Some(fee_value) } else { fee = None }

        let tx_type: u8;
        match tx.tx_type.as_str() {
            "Transfer" => {tx_type = 0},
            "Mint" => {tx_type = 1},
            "Burn" => {tx_type = 2},
            "Approve" => {tx_type = 3},
            _ => {tx_type = 99},
        }

        stx.push(SmallTX{
                    block: tx.block as u64,
                    time: tx.tx_time,
                    from: fm, 
                    to: to,
                    tx_type,
                    value: tx.tx_value.clone(),
                    fee  
                });
    } // for
    return stx;
}

pub fn processedtx_to_principal_only_smalltx(input_vec: &Vec<ProcessedTX>) -> Vec<SmallTX> {
    let mut stx:Vec<SmallTX> = Vec::new();
    for tx in input_vec {

        // get refs for from/ to accounts
        let fm: Option<u64>;
        let fm_ac = tx.from_account.as_str();
        if  fm_ac != "Token Ledger" 
        {   
            if tx.from_account.contains(".") {
                let parse = parse_icrc_account(&tx.from_account).unwrap();
                fm = add_to_directory(&parse.0);
            } else {
                fm = None;
            }
        } else { fm = None };

        let to: Option<u64>;
        let to_ac = tx.to_account.as_str();
        if  to_ac != "Token Ledger" 
        {   
            if tx.to_account.contains(".") {
                let parse = parse_icrc_account(&tx.to_account).unwrap();
                to = add_to_directory(&parse.0);
            } else  {
                to = None;
            }
        } else { to = None };

        let fee: Option<u128>;
        if let Some(fee_value) = tx.tx_fee.clone() { fee = Some(fee_value) } else { fee = None }

        let tx_type: u8;
        match tx.tx_type.as_str() {
            "Transfer" => {tx_type = 0},
            "Mint" => {tx_type = 1},
            "Burn" => {tx_type = 2},
            "Approve" => {tx_type = 3},
            _ => {tx_type = 99},
        }

        stx.push(SmallTX{
                    block: tx.block as u64,
                    time: tx.tx_time,
                    from: fm, 
                    to: to,
                    tx_type,
                    value: tx.tx_value.clone(),
                    fee  
                });
        } 
    return stx;
}
