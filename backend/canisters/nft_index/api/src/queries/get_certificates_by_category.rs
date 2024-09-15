use candid::CandidType;
use serde::{ Deserialize, Serialize };

use crate::certificate::Certificate;

pub type Args = GetCertificatesByCategoryArgs;
pub type Response = Result<Vec<Certificate>, String>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct GetCertificatesByCategoryArgs {
    pub category: String,
    pub offset: usize,
    pub limit: usize,
}
