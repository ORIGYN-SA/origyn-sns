#[cfg(test)]
mod tests {
    use std::{fs::File, io::Read, path::PathBuf};

    use candid::{encode_one, Principal};
    use ic_cdk::api::management_canister::main::CanisterId;
    use pocket_ic::{PocketIc, WasmResult};
    use utils::consts::OGY_LEGACY_LEDGER_CANISTER_ID;

    // 2T cycles
    const INIT_CYCLES: u128 = 2_000_000_000_000;

    #[test]
    fn test_counter_canister() {
        let pic = PocketIc::new();

        // Create an empty canister as the anonymous principal and add cycles.
        // let canister_id = OGY_LEGACY_LEDGER_CANISTER_ID;
        // let _ = pic.create_canister_with_id(None, None, canister_id);
        let canister_id = pic.create_canister();
        pic.add_cycles(canister_id, 2_000_000_000_000);

        let wasm_bytes = load_wasm();
        pic.install_canister(canister_id, wasm_bytes, vec![], None);
        // // 'inc' is a counter canister method.
        // call_counter_canister(&pic, canister_id, "inc");
        // // Check if it had the desired effect.
        // let reply = call_counter_canister(&pic, canister_id, "read");
        // assert_eq!(reply, WasmResult::Reply(vec![0, 0, 0, 1]));
    }

    fn call_counter_canister(pic: &PocketIc, canister_id: CanisterId, method: &str) -> WasmResult {
        pic.update_call(
            canister_id,
            Principal::anonymous(),
            method,
            encode_one(()).unwrap(),
        )
        .expect("Failed to call counter canister")
    }

    fn load_wasm() -> Vec<u8> {
        let mut file_path = PathBuf::from(
            std::env::var("CARGO_MANIFEST_DIR")
                .expect("Failed to read CARGO_MANIFEST_DIR env variable"),
        );
        file_path.push("wasms");

        file_path.push("ogy-legacy-ledger.wasm");
        println!("path: {file_path:?}");

        let mut file = File::open(&file_path)
            .unwrap_or_else(|_| panic!("Failed to open file: {}", file_path.to_str().unwrap()));
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes).expect("Failed to read file");
        bytes
    }
}
