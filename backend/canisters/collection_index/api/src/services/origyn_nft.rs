use candid::Nat;

pub enum GetCollectionInfoError {
    GenericOrigynNftError(String),
    CanisterToCanisterCallError(String),
}
pub struct GetCollectionInfoResult {
    pub name: Option<String>,
    pub logo_url: Option<String>,
    pub certificates_count: Nat,
}

impl From<origyn_nft_reference::origyn_nft_reference_canister::CollectionInfo>
for GetCollectionInfoResult {
    fn from(value: origyn_nft_reference::origyn_nft_reference_canister::CollectionInfo) -> Self {
        let token_ids_count = value.token_ids_count.unwrap_or(Nat::from(0u64));
        Self {
            name: value.name,
            logo_url: value.logo,
            certificates_count: token_ids_count,
        }
    }
}
