#[cfg(test)]
mod test {
    use candid::{decode_one, encode_one, Nat, Principal};
    use ic_cdk::api::management_canister::provisional::CanisterId;
    use ledger_utils::principal_to_legacy_account_id;
    use ogy_legacy_ledger_canister::{
        init::InitArgs, Account, Name, Tokens, TransferArg, TransferError,
    };
    use pocket_ic::{PocketIc, WasmResult};
    use std::path::PathBuf;
    use utils::consts::{
        OGY_LEDGER_CANISTER_ID, OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID,
        OGY_LEGACY_MINTING_CANISTER_ID,
    };

    // 2T cycles
    const INIT_CYCLES: u128 = 2_000_000_000_000;

    pub fn init_ogy_legacy_ledger_caniser(
        pic: &PocketIc,
        initial_values: Vec<(String, Tokens)>,
    ) -> Principal {
        // Create a canister and charge it with 2T cycles.
        let can_id = pic.create_canister();
        pic.add_cycles(can_id, INIT_CYCLES);

        let args = InitArgs {
            minting_account: OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID.to_string(),
            initial_values,
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
        can_id
    }

    #[test]
    fn test_ogy_legacy_ledger_canister() {
        let pic = PocketIc::new();

        let caller =
            Principal::from_text("465sx-szz6o-idcax-nrjhv-hprrp-qqx5e-7mqwr-wadib-uo7ap-lofbe-dae")
                .unwrap();
        let initial_values = vec![(
            principal_to_legacy_account_id(caller, None).to_string(),
            Tokens {
                e8s: 100_000_000u64,
            },
        )];

        let cid = init_ogy_legacy_ledger_caniser(&pic, initial_values);

        // Check name and symbol.
        let result = pic.query_call(cid, caller, "name", encode_one(()).unwrap());

        let WasmResult::Reply(reply) = result.unwrap() else {
            unreachable!()
        };
        let resp: Name = decode_one(&reply).unwrap();
        assert_eq!(resp.name, "Origyn");

        // let resp: Symbol = cross_canister_call(&pic, proxy_canister, ledger_canister, "symbol", ());
        // assert_eq!(resp.symbol, "MYTOKEN");

        // Check initial balance of the beneficiary.
        let result = pic.query_call(
            cid,
            caller,
            "icrc1_balance_of",
            encode_one(Account {
                owner: caller,
                subaccount: None,
            })
            .unwrap(),
        );

        let WasmResult::Reply(reply) = result.unwrap() else {
            unreachable!()
        };
        let resp: Nat = decode_one(&reply).unwrap();
        assert_eq!(resp, Nat::from(100_000_000u64));

        // transfer
        let result = pic.update_call(
            cid,
            caller,
            "icrc1_transfer",
            encode_one(TransferArg {
                to: Account {
                    owner: OGY_LEGACY_MINTING_CANISTER_ID,
                    subaccount: None,
                },
                fee: Some(Nat::from(200_000u64)),
                memo: None,
                from_subaccount: None,
                created_at_time: None,
                amount: Nat::from(10_000_000u64),
            })
            .unwrap(),
        );

        let WasmResult::Reply(reply) = result.unwrap() else {
            unreachable!()
        };
        let resp: Result<Nat, TransferError> = decode_one(&reply).unwrap();
        // assert!(resp.is_ok());
        assert_eq!(
            resp,
            Err(TransferError::BadFee {
                expected_fee: Nat::from(200_000u64)
            })
        );
        if let Ok(val) = resp {
            println!("Block: {val}");
        }

        // Check initial balance of the beneficiary.
        let result = pic.query_call(
            cid,
            caller,
            "icrc1_balance_of",
            encode_one(Account {
                owner: caller,
                subaccount: None,
            })
            .unwrap(),
        );

        let WasmResult::Reply(reply) = result.unwrap() else {
            unreachable!()
        };
        let resp: Nat = decode_one(&reply).unwrap();
        assert_eq!(resp, Nat::from(90_000_000u64));
        // // Transfer 420 tokens to the beneficiary from the proxy canister.
        // let resp = transfer(
        //     &pic,
        //     proxy_canister,
        //     ledger_canister,
        //     beneficiary,
        //     420,
        //     10_000,
        // );
        // assert!(resp.is_ok());

        // let ogy_swap_canister_id = Principal::from_text("text".to_string()).unwrap();

        // let transfer_args = TransferArgs {
        //     to: AccountIdentifier::new(&ogy_swap_canister_id, &DEFAULT_SUBACCOUNT),
        //     memo: Memo(0),
        //     fee: Tokens::from_e8s(0),
        //     amount: Tokens::from_e8s(100_000_000),
        //     from_subaccount: None,
        //     created_at_time: None,
        // };
        // // Try to transfer tokens again, but with an insufficent fee.
        // let resp = transfer(cid, &transfer_args);
        // assert_eq!(
        //     resp,
        //     Err(TransferError::BadFee {
        //         expected_fee: Tokens::from_e8s(10_000)
        //     })
        // );

        // // Check new balance of the beneficiary.
        // let balance = balance_of(&pic, proxy_canister, ledger_canister, beneficiary);
        // assert_eq!(balance, Tokens::from_e8s(420));
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
