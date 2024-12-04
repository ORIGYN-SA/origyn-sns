use lazy_static::lazy_static;
use std::fs::File;
use std::io::Read;
use types::CanisterWasm;

lazy_static! {
    // external canisters
    pub static ref OGY_LEGACY_LEDGER: CanisterWasm =
        get_external_canister_wasm("ogy_legacy_ledger");
    pub static ref IC_ICRC1_LEDGER: CanisterWasm = get_external_canister_wasm("icrc_ledger");
    pub static ref SNS_GOVERNANCE: CanisterWasm = get_external_canister_wasm("sns_governance");
    pub static ref ORIGYN_NFT: CanisterWasm = get_external_canister_wasm("origyn_nft_reference");
    // internal canisters
    pub static ref OGY_TOKEN_SWAP: CanisterWasm = get_internal_canister_wasm("ogy_token_swap");
    pub static ref TOKEN_METRICS: CanisterWasm = get_internal_canister_wasm("token_metrics");
    pub static ref REWARDS: CanisterWasm = get_internal_canister_wasm("sns_rewards");
    pub static ref SUPER_STATS_V3: CanisterWasm = get_internal_canister_wasm("super_stats_v3");
    pub static ref CANISTER_JOBS: CanisterWasm = get_internal_canister_wasm("canister_jobs");
    pub static ref COLLECTION_INDEX: CanisterWasm = get_internal_canister_wasm("collection_index");
}

fn get_internal_canister_wasm(canister: &str) -> Vec<u8> {
    read_file_from_relative_bin(
        &format!(
            "../canisters/{canister}/target/wasm32-unknown-unknown/release/{canister}_canister.wasm.gz"
        )
    ).unwrap()
}
fn get_external_canister_wasm(canister: &str) -> Vec<u8> {
    read_file_from_relative_bin(
        &format!("../external_canisters/{canister}/wasm/{canister}_canister.wasm.gz")
    ).unwrap()
}

fn read_file_from_relative_bin(file_path: &str) -> Result<Vec<u8>, std::io::Error> {
    // Open the wasm file
    let mut file = File::open(file_path)?;

    // Read the contents of the file into a vector
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;

    Ok(buffer)
}
