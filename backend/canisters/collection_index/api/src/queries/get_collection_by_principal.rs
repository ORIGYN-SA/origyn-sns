use candid::Principal;

use crate::{ collection::Collection, errors::GetCollectionByPrincipal };

pub type Args = Principal;
pub type Response = Result<Collection, GetCollectionByPrincipal>;
