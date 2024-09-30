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
    CategoryNotFound(String),
}
#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub enum UpdateCollectionCategoryError {
    CollectionNotFound,
    CategoryNotFound(String),
}
#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub enum GetCollectionsError {
    CategoryNotFound(String),
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

#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub enum SetCategoryHiddenError {
    CategoryNotFound,
}

#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub enum InsertCategoryError {
    CategoryAlreadyExists,
}

#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub enum RemoveCollectionError {
    CollectionNotFound,
}
