use candid::Principal;

pub type Args = Principal;
pub type Response = Result<bool, String>;
