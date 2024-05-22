use icrc_ledger_types::icrc1::account::Account;
use crate::token_data::{ GetHoldersArgs, WalletOverview };

pub type Args = GetHoldersArgs;
pub type Response = Vec<(Account, WalletOverview)>;
