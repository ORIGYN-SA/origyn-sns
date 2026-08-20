use lazy_static::lazy_static;
use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use types::CanisterWasm;

lazy_static! {
    // external canisters
    pub static ref OGY_LEGACY_LEDGER: CanisterWasm =
        get_external_canister_wasm("ogy_legacy_ledger");
    pub static ref IC_ICRC1_LEDGER: CanisterWasm = get_canister_wasm("ic_icrc1_ledger");
    pub static ref IC_ICRC2_LEDGER: CanisterWasm = get_canister_wasm_gz("icrc_ledger");
    pub static ref ORIGYN_NFT: CanisterWasm = get_external_canister_wasm("origyn_nft_reference");

    pub static ref SNS_REWARDS_OLD: CanisterWasm = get_canister_wasm_gz("sns_rewards_old");
    pub static ref GOLD_REWARDS: CanisterWasm = get_external_canister_wasm("sns_rewards");

    // internal canisters
    pub static ref OGY_TOKEN_SWAP: CanisterWasm = get_internal_canister_wasm("ogy_token_swap");
    pub static ref REWARDS: CanisterWasm = get_internal_canister_wasm("sns_rewards");
    pub static ref CANISTER_JOBS: CanisterWasm = get_internal_canister_wasm("canister_jobs");
    pub static ref COLLECTION_INDEX: CanisterWasm = get_internal_canister_wasm("collection_index");
    pub static ref BUYBACK_BURN: CanisterWasm = get_internal_canister_wasm("dex_interaction");

    // SNS wasms
    pub static ref SNS_SWAP: CanisterWasm = get_canister_wasm_gz("sns_swap");
    pub static ref SNS_INDEX: CanisterWasm = get_canister_wasm_gz("ic_icrc1_index");
    pub static ref SNS_GOVERNANCE: CanisterWasm = get_canister_wasm_gz("sns_governance");
    pub static ref SNS_ROOT: CanisterWasm = get_canister_wasm_gz("sns_root");
    pub static ref SNS_LEDGER: CanisterWasm = get_canister_wasm("ic_icrc1_ledger");

    // Wasms in particular canister folder
    pub static ref SNS_NEURON_CONTROLLER: CanisterWasm =
        get_canister_wasm_from_bin("sns_neuron_controller");

    // NNS wasms
    pub static ref NNS_LIFELINE: CanisterWasm = get_nns_canister_wasm("nns_lifeline");
    pub static ref NNS_ROOT: CanisterWasm = get_nns_canister_wasm("nns_root");
    pub static ref NNS_GOVERNANCE: CanisterWasm = get_nns_canister_wasm("nns_governance");
    pub static ref NNS_LEDGER: CanisterWasm =  get_nns_canister_wasm("nns_ledger");
    pub static ref NNS_REGISTRY: CanisterWasm = get_nns_canister_wasm("nns_registry");
    pub static ref NNS_GENESIS_TOKEN: CanisterWasm = get_nns_canister_wasm("nns_genesis_token");
    pub static ref NNS_INDEX: CanisterWasm = get_nns_canister_wasm("nns_index");
    pub static ref NNS_CYCLES_MINTING: CanisterWasm = get_nns_canister_wasm("cycles_minting");
    pub static ref NNS_UI: CanisterWasm = get_nns_canister_wasm("nns_ui");
    pub static ref NNS_WASM_ID: CanisterWasm = get_nns_canister_wasm("nns_wasm_id");
}

fn get_internal_canister_wasm(canister: &str) -> Vec<u8> {
    read_file_from_relative_bin(&format!(
        "../canisters/{canister}/target/wasm32-unknown-unknown/release/{canister}_canister.wasm.gz"
    ))
    .unwrap()
}

fn get_external_canister_wasm(canister: &str) -> Vec<u8> {
    read_file_from_relative_bin(&format!(
        "../external_canisters/{canister}/wasm/{canister}_canister.wasm.gz"
    ))
    .unwrap()
}

fn read_file_from_relative_bin(file_path: &str) -> Result<Vec<u8>, std::io::Error> {
    // Open the wasm file
    let mut file = File::open(file_path)?;

    // Read the contents of the file into a vector
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;

    Ok(buffer)
}

fn get_canister_wasm(canister_name: &str) -> CanisterWasm {
    read_file_from_local_bin(&format!("{canister_name}_canister.wasm"))
}

fn get_canister_wasm_gz(canister_name: &str) -> CanisterWasm {
    read_file_from_local_bin(&format!("{canister_name}_canister.wasm.gz"))
}

fn read_file_from_local_bin(file_name: &str) -> Vec<u8> {
    let mut file_path = local_bin();
    file_path.push(file_name);

    let mut file = File::open(&file_path)
        .unwrap_or_else(|_| panic!("Failed to open file: {}", file_path.to_str().unwrap()));
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes).expect("Failed to read file");
    bytes
}

pub fn local_bin() -> PathBuf {
    let mut file_path = PathBuf::from(
        std::env::var("CARGO_MANIFEST_DIR")
            .expect("Failed to read CARGO_MANIFEST_DIR env variable"),
    );
    file_path.push("wasms");
    file_path
}

fn get_canister_wasm_from_bin(canister_name: &str) -> CanisterWasm {
    match
        read_file_from_relative_bin(
            &format!(
                "../canisters/{canister_name}/target/wasm32-unknown-unknown/release/{canister_name}_canister.wasm.gz"
            )
        )
    {
        Ok(wasm) => wasm,
        Err(err) => {
            println!(
                "Failed to read {canister_name} wasm: {err}. \n\x1b[31mRun \"./scripts/build_canister.sh {canister_name}\"\x1b[0m"
            );
            panic!()
        }
    }
}

fn get_nns_canister_wasm(canister_name: &str) -> CanisterWasm {
    match read_file_from_relative_bin(&format!(
        "../integration_testing/wasms/nns/{canister_name}_canister.wasm.gz"
    )) {
        Ok(wasm) => wasm,
        Err(err) => {
            println!(
            "Failed to read {canister_name} wasm: {err}. \n\x1b[31mRun \"./scripts/build_canister.sh {canister_name}\"\x1b[0m"
        );
            panic!()
        }
    }
}
