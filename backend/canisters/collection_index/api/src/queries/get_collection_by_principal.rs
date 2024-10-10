use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::{ category::CategoryID, collection::Collection, errors::GetCollectionByPrincipal };

pub type Args = Principal;
pub type Response = Result<Collection, GetCollectionByPrincipal>;
