use candid::Principal;

pub type Args = ();
pub type Response = Vec<(Principal, u64)>;
