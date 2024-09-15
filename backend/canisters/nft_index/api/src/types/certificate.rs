#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub struct Certificate {
    pub certificate_id: String,
    pub collection_id: String,
    pub category: String,
}
