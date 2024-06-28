use candid::CandidType;
use serde::{ Deserialize, Serialize };
use types::CanisterId;

#[derive(Debug, Serialize, Deserialize, CandidType)]
pub struct Args {
    pub ledger_canister_id: CanisterId,
    pub transfer_args: icrc_ledger_types::icrc1::transfer::TransferArg,
}
pub type Response = ();
