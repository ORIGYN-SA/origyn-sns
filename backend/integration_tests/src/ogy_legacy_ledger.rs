#[cfg(test)]
mod test {
    use candid::{encode_one, Principal};
    use ic_cdk::api::management_canister::provisional::CanisterId;
    // use ic_ledger_types::{AccountIdentifier, Tokens};
    use ogy_legacy_ledger_canister::{init::InitArgs, Tokens};
    use pocket_ic::{PocketIc, WasmResult};
    use std::path::PathBuf;
    use utils::consts::OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID;

    // 2T cycles
    const INIT_CYCLES: u128 = 2_000_000_000_000;

    #[test]
    fn test_ogy_legacy_ledger_canister() {
        let pic = PocketIc::new();

        // Create a canister and charge it with 2T cycles.
        let can_id = pic.create_canister();
        pic.add_cycles(can_id, INIT_CYCLES);

        let args = InitArgs {
            minting_account: OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID.to_string(),
            initial_values: vec![],
            max_message_size_bytes: None,
            transaction_window: None,
            archive_options: None,
            send_whitelist: vec![],
            transfer_fee: Some(Tokens { e8s: 200_000u64 }),
            token_symbol: Some("OGY".to_string()),
            token_name: Some("Origyn".to_string()),
            icrc1_minting_account: None,
        };

        // Install the counter canister wasm file on the canister.
        let wasm = load_wasm();
        pic.install_canister(can_id, wasm, encode_one(args).unwrap(), None);

        // Make some calls to the canister.
        // let reply = call_counter_can(&pic, can_id, "read");
        // assert_eq!(reply, WasmResult::Reply(vec![0, 0, 0, 0]));
        // let reply = call_counter_can(&pic, can_id, "write");
        // assert_eq!(reply, WasmResult::Reply(vec![1, 0, 0, 0]));
        // let reply = call_counter_can(&pic, can_id, "write");
        // assert_eq!(reply, WasmResult::Reply(vec![2, 0, 0, 0]));
        // let reply = call_counter_can(&pic, can_id, "read");
        // assert_eq!(reply, WasmResult::Reply(vec![2, 0, 0, 0]));
    }

    fn load_wasm() -> Vec<u8> {
        let mut file_path = PathBuf::from(
            std::env::var("CARGO_MANIFEST_DIR")
                .expect("Failed to read CARGO_MANIFEST_DIR env variable"),
        );
        file_path.push("wasms");
        file_path.push("ogy-legacy-ledger.wasm");

        std::fs::read(file_path).unwrap()
    }

    fn call_counter_can(ic: &PocketIc, can_id: CanisterId, method: &str) -> WasmResult {
        ic.update_call(
            can_id,
            Principal::anonymous(),
            method,
            encode_one(()).unwrap(),
        )
        .expect("Failed to call counter canister")
    }
}
