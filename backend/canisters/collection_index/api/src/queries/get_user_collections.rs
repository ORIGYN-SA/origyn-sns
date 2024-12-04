use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::{ collection::Collection, errors::GetCollectionsError };

pub type Args = Option<Principal>;
pub type Response = Vec<Collection>;
