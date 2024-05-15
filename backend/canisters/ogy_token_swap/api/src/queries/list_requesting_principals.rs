use std::collections::HashSet;

use candid::Principal;

pub type Args = ();

pub type Response = HashSet<Principal>;
