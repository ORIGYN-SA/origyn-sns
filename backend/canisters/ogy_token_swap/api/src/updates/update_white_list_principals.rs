use std::collections::HashSet;

use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

pub type Args = HashSet<Principal>;

pub type Response = ();
