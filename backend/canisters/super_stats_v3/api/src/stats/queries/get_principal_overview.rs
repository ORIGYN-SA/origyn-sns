use candid::CandidType;

use crate::account_tree::Overview;

#[derive(CandidType)]
pub struct SArgs {
    account: String,
}
pub type Args = SArgs;
pub type Response = Option<Overview>;
