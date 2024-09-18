#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub enum InsertCertificateError {
    CertificateAlreadyExists,
    TargetCollectionDoesNotExist,
}

#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub enum InsertCollectionError {
    CollectionAlreadyExists,
    GenericOrigynNftError(String),
    TargetCanisterIdNotOrigyn,
}
impl From<crate::services::origyn_nft::GetCollectionInfoError> for InsertCollectionError {
    fn from(error: crate::services::origyn_nft::GetCollectionInfoError) -> Self {
        match error {
            crate::services::origyn_nft::GetCollectionInfoError::CanisterToCanisterCallError(_) =>
                Self::TargetCanisterIdNotOrigyn,
            crate::services::origyn_nft::GetCollectionInfoError::GenericOrigynNftError(e) =>
                Self::GenericOrigynNftError(e),
        }
    }
}
