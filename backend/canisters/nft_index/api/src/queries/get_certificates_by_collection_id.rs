use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::certificate::Certificate;

pub type Args = GetCertificatesByCollectionArgs;
pub type Response = Result<Vec<Certificate>, String>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct GetCertificatesByCollectionArgs {
    pub collection_id: Principal,
    pub offset: usize,
    pub limit: usize,
}
