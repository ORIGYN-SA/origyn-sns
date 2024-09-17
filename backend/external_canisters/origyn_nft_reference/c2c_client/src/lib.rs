use canister_client::generate_candid_c2c_call;

use origyn_nft_reference::origyn_nft_reference_canister::CollectionResult;
use origyn_nft_reference::origyn_nft_reference_canister::NftInfoResult;

pub mod nft_origyn {
    use super::*;
    pub type Args = String;
    pub type Response = NftInfoResult;
}

pub mod collection_nft_origyn {
    use super::*;
    pub type Args = Option<Vec<(String, Option<candid::Nat>, Option<candid::Nat>)>>;
    pub type Response = CollectionResult;
}

generate_candid_c2c_call!(nft_origyn);
generate_candid_c2c_call!(collection_nft_origyn);
