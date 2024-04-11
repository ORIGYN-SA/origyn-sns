use candid::{ decode_one, encode_one, Nat, Principal };
use ic_cdk::api::management_canister::provisional::CanisterId;
use ledger_utils::principal_to_legacy_account_id;
use ogy_token_swap::lifecycle::Args as InitArgsOgySwap;
use ogy_legacy_ledger_canister::{
    init::InitArgs,
    Account,
    ArchiveOptions,
    Duration,
    Name,
    Tokens,
    TransferArg,
    TransferError,
    TransferFee,
};

use pocket_ic::{ PocketIc, WasmResult };
use std::path::PathBuf;
use utils::consts::{ OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID, OGY_LEGACY_MINTING_CANISTER_ID };

// 2T cycles
const INIT_CYCLES: u128 = 2_000_000_000_000;

pub fn init_ogy_swap_canister(pic: &PocketIc, initial_values: Vec<(String, Tokens)>) -> Principal {
    // Create a canister and charge it with 2T cycles.
    let can_id = pic.create_canister();
    pic.add_cycles(can_id, INIT_CYCLES * 10);

    let args = InitArgsOgySwap { test_mode: true };

    // Install the counter canister wasm file on the canister.
    let wasm = load_wasm_ogy_swap();
    pic.install_canister(can_id, wasm.clone(), encode_one(args).unwrap(), None);
    can_id
}
pub fn init_ogy_legacy_ledger_canister(
    pic: &PocketIc,
    initial_values: Vec<(String, Tokens)>
) -> Principal {
    // Create a canister and charge it with 2T cycles.
    let can_id = pic.create_canister();
    pic.add_cycles(can_id, INIT_CYCLES * 10);

    let args = InitArgs {
        minting_account: OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID.to_string(),
        initial_values,
        max_message_size_bytes: None,
        transaction_window: Some(Duration {
            secs: 600,
            nanos: 0,
        }),
        archive_options: Some(ArchiveOptions {
            trigger_threshold: 2000,
            num_blocks_to_archive: 1000,
            node_max_memory_size_bytes: None,
            max_message_size_bytes: None,
            controller_id: Principal::anonymous(),
        }),
        standard_whitelist: vec![],
        transfer_fee: Some(Tokens { e8s: 200_000 }),
        admin: Principal::anonymous(),
        send_whitelist: vec![],
        token_symbol: Some("OGY".to_string()),
        token_name: Some("Origyn".to_string()),
    };

    // Install the counter canister wasm file on the canister.
    let wasm = load_wasm();
    pic.install_canister(can_id, wasm.clone(), encode_one(args).unwrap(), None);
    // if let Ok(status) = pic.canister_status(can_id, None) {
    //     println!("Canister status: {:?}", status);
    // };
    // pic.tick();
    // let _ = pic.upgrade_canister(can_id, wasm, encode_one(()).unwrap(), None);
    can_id
}

#[test]
fn test_ogy_legacy_ledger_canister() {
    let pic = PocketIc::new();

    let caller = Principal::from_text(
        "465sx-szz6o-idcax-nrjhv-hprrp-qqx5e-7mqwr-wadib-uo7ap-lofbe-dae"
    ).unwrap();
    let initial_values = vec![(
        principal_to_legacy_account_id(caller, None).to_string(),
        Tokens {
            e8s: 100_000_000u64,
        },
    )];

    let cid = init_ogy_legacy_ledger_canister(&pic, initial_values);

    // Check name and symbol.
    let resp = query_call_name(&pic, cid, caller);
    assert_eq!(resp.name, "Origyn");
    // Check transfer fee.
    // let resp = query_call_transfer_fee(&pic, cid, caller);
    // assert_eq!(
    //     resp,
    //     TransferFee {
    //         transfer_fee: Tokens { e8s: 200_000 }
    //     }
    // );
    // Check icrc1 fee.
    let resp = query_call_icrc1_fee(&pic, cid, caller);
    assert_eq!(resp, Nat::from(200_000u64));

    // Check initial balance of the beneficiary.
    let result = pic.query_call(
        cid,
        caller,
        "icrc1_balance_of",
        encode_one(Account {
            owner: caller,
            subaccount: None,
        }).unwrap()
    );

    let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    let resp: Nat = decode_one(&reply).unwrap();
    assert_eq!(resp, Nat::from(100_000_000u64));

    // transfer
    let result = pic.update_call(
        cid,
        caller,
        "icrc1_transfer",
        encode_one(TransferArg {
            to: Account {
                owner: Principal::anonymous(),
                subaccount: None,
            },
            fee: None,
            memo: None,
            from_subaccount: None,
            created_at_time: None,
            amount: Nat::from(10_000_000u64),
        }).unwrap()
    );

    let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    let resp: Result<Nat, TransferError> = decode_one(&reply).unwrap();
    assert!(resp.is_ok());
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
        }).unwrap()
    );

    let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    let resp: Nat = decode_one(&reply).unwrap();
    assert_eq!(resp, Nat::from(89_800_000u64));
}

fn load_wasm() -> Vec<u8> {
    let mut file_path = PathBuf::from(
        std::env::var("CARGO_MANIFEST_DIR").expect("Failed to read CARGO_MANIFEST_DIR env variable")
    );
    file_path.push("wasms");
    file_path.push("ogy-legacy-ledger.gz");

    std::fs::read(file_path).unwrap()
}
fn load_wasm_ogy_swap() -> Vec<u8> {
    let mut file_path = PathBuf::from(
        std::env::var("CARGO_MANIFEST_DIR").expect("Failed to read CARGO_MANIFEST_DIR env variable")
    );
    file_path.push("wasms");
    file_path.push("ogy_token_swap_canister.wasm.gz");

    std::fs::read(file_path).unwrap()
}

fn query_call_name(pic: &PocketIc, can_id: CanisterId, caller: Principal) -> Name {
    let result = pic.query_call(can_id, caller, "name", encode_one(()).unwrap());

    let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    decode_one(&reply).unwrap()
}
fn query_call_transfer_fee(pic: &PocketIc, can_id: CanisterId, caller: Principal) -> TransferFee {
    let result = pic.query_call(can_id, caller, "transfer_fee", encode_one(()).unwrap());

    let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    decode_one(&reply).unwrap()
}
fn query_call_icrc1_fee(pic: &PocketIc, can_id: CanisterId, caller: Principal) -> Nat {
    let result = pic.query_call(can_id, caller, "icrc1_fee", encode_one(()).unwrap());

    let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    decode_one(&reply).unwrap()
}
