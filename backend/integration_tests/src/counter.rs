#[cfg(test)]
mod test {
    use candid::{encode_one, Principal};
    use ic_cdk::api::management_canister::provisional::CanisterId;
    use pocket_ic::{PocketIc, WasmResult};
    use std::path::PathBuf;

    // 2T cycles
    const INIT_CYCLES: u128 = 2_000_000_000_000;

    #[test]
    fn test_counter_canister() {
        let pic = PocketIc::new();

        // Create a canister and charge it with 2T cycles.
        let can_id = pic.create_canister();
        pic.add_cycles(can_id, INIT_CYCLES);

        // Install the counter canister wasm file on the canister.
        let counter_wasm = counter_wasm();
        pic.install_canister(can_id, counter_wasm, vec![], None);

        // Make some calls to the canister.
        let reply = call_counter_can(&pic, can_id, "read");
        assert_eq!(reply, WasmResult::Reply(vec![0, 0, 0, 0]));
        let reply = call_counter_can(&pic, can_id, "write");
        assert_eq!(reply, WasmResult::Reply(vec![1, 0, 0, 0]));
        let reply = call_counter_can(&pic, can_id, "write");
        assert_eq!(reply, WasmResult::Reply(vec![2, 0, 0, 0]));
        let reply = call_counter_can(&pic, can_id, "read");
        assert_eq!(reply, WasmResult::Reply(vec![2, 0, 0, 0]));
    }

    fn counter_wasm() -> Vec<u8> {
        let mut file_path = PathBuf::from(
            std::env::var("CARGO_MANIFEST_DIR")
                .expect("Failed to read CARGO_MANIFEST_DIR env variable"),
        );
        file_path.push("wasms");
        file_path.push("counter.wasm");

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
