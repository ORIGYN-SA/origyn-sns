use candid::{ decode_one, encode_one, Nat, Principal };
use ic_cdk::api::management_canister::provisional::CanisterId;
use ic_ledger_types::{ AccountIdentifier, BlockIndex, Memo, Subaccount, Tokens, TransferArgs };
use ledger_utils::principal_to_legacy_account_id;
use ogy_token_swap::{
    consts::OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID,
    lifecycle::InitArgs as InitArgsOgySwap,
    updates::swap_tokens::{ SwapTokensRequest, SwapTokensResponse },
};
use ogy_legacy_ledger_canister::{
    init::InitArgs,
    Account,
    ArchiveOptions,
    Duration,
    Name,
    TransferError,
    TransferFee,
};

use pocket_ic::{ PocketIc, WasmResult };
use std::path::PathBuf;
use utils::consts::E8S_FEE_OGY;

// 2T cycles
const INIT_CYCLES: u128 = 2_000_000_000_000;

pub fn init_ogy_swap_canister(
    pic: &PocketIc,
    ogy_legacy_ledger_canister_id: CanisterId,
    ogy_new_ledger_canister_id: CanisterId
) -> Principal {
    // Create a canister and charge it with 2T cycles.
    let can_id = pic.create_canister();
    pic.add_cycles(can_id, INIT_CYCLES * 10);

    let args = InitArgsOgySwap {
        test_mode: true,
        ogy_legacy_ledger_canister_id,
        ogy_new_ledger_canister_id,
    };

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
        transfer_fee: Some(Tokens::from_e8s(E8S_FEE_OGY)),
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

// #[test]
// fn test_ogy_swap_canister() {
//     // let pic = PocketIc::new();

//     let caller = Principal::from_text(
//         "465sx-szz6o-idcax-nrjhv-hprrp-qqx5e-7mqwr-wadib-uo7ap-lofbe-dae"
//     ).unwrap();

//     let cid = init_ogy_swap_canister(&pic);
//     let args: SwapTokensRequest = SwapTokensRequest {
//         block_index: 1,
//         user: None,
//     };
//     let res = update_call_swap_tokens(&pic, cid, caller, args);
//     println!("Swap result: {:?}", res)
// }

fn update_call_swap_tokens(
    pic: &PocketIc,
    can_id: CanisterId,
    caller: Principal,
    args: SwapTokensRequest
) -> SwapTokensResponse {
    let result = pic.update_call(can_id, caller, "swap_tokens", encode_one(args).unwrap());

    let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    decode_one(&reply).unwrap()
}

#[test]
fn test_ogy_legacy_ledger_canister() {
    let pic = PocketIc::new();

    let caller = Principal::from_text(
        "465sx-szz6o-idcax-nrjhv-hprrp-qqx5e-7mqwr-wadib-uo7ap-lofbe-dae"
    ).unwrap();
    let initial_values = vec![
        (principal_to_legacy_account_id(caller, None).to_string(), Tokens::from_e8s(100_000_000)),
        (
            principal_to_legacy_account_id(
                Principal::from_text("lqy7q-dh777-77777-aaaaq-cai").unwrap(),
                None
            ).to_string(),
            Tokens::from_e8s(1_000_000_000),
        )
    ];

    let cid_legacy = init_ogy_legacy_ledger_canister(&pic, initial_values);
    println!("OGY legacy ledger id: {:?}", cid_legacy.to_string());
    let cid_swap = init_ogy_swap_canister(&pic, cid_legacy, cid_legacy);
    println!("Swap canister id: {:?}", cid_swap.to_string());

    // transfer
    let to = AccountIdentifier::new(&cid_swap, &Subaccount::from(caller));
    let result = pic.update_call(
        cid_legacy,
        caller,
        "transfer",
        encode_one(TransferArgs {
            to,
            fee: Tokens::from_e8s(E8S_FEE_OGY),
            memo: Memo(0),
            from_subaccount: None,
            created_at_time: None,
            amount: Tokens::from_e8s(10_000_000),
        }).unwrap()
    );
    let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    let resp: Result<BlockIndex, TransferError> = decode_one(&reply).unwrap();
    let block = resp.unwrap();
    println!("Block: {block}");

    let args: SwapTokensRequest = SwapTokensRequest {
        block_index: block,
        user: None,
    };
    let res = update_call_swap_tokens(&pic, cid_swap, caller, args);
    println!("Swap result: {:?}", res);

    // // Check name and symbol.
    // let resp = query_call_name(&pic, cid, caller);
    // assert_eq!(resp.name, "Origyn");
    // // Check transfer fee.
    // // let resp = query_call_transfer_fee(&pic, cid, caller);
    // // assert_eq!(
    // //     resp,
    // //     TransferFee {
    // //         transfer_fee: Tokens { e8s: 200_000 }
    // //     }
    // // );
    // // Check icrc1 fee.
    // let resp = query_call_icrc1_fee(&pic, cid, caller);
    // assert_eq!(resp, Nat::from(200_000u64));

    // Check final balance of the swap canister.
    let result = pic.query_call(
        cid_legacy,
        caller,
        "icrc1_balance_of",
        encode_one(Account {
            owner: Principal::from_text("lqy7q-dh777-77777-aaaaq-cai").unwrap(),
            subaccount: None,
        }).unwrap()
    );
    let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    let resp: Nat = decode_one(&reply).unwrap();
    println!("Final balance of swap canister: {resp}")

    // assert_eq!(resp, Nat::from(100_000_000u64));

    // // transfer
    // let result = pic.update_call(
    //     cid,
    //     caller,
    //     "icrc1_transfer",
    //     encode_one(TransferArg {
    //         to: Account {
    //             owner: Principal::anonymous(),
    //             subaccount: None,
    //         },
    //         fee: None,
    //         memo: None,
    //         from_subaccount: None,
    //         created_at_time: None,
    //         amount: Nat::from(10_000_000u64),
    //     }).unwrap()
    // );

    // let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    // let resp: Result<Nat, TransferError> = decode_one(&reply).unwrap();
    // assert!(resp.is_ok());
    // if let Ok(val) = resp {
    //     println!("Block: {val}");
    // }

    // // Check initial balance of the beneficiary.
    // let result = pic.query_call(
    //     cid,
    //     caller,
    //     "icrc1_balance_of",
    //     encode_one(Account {
    //         owner: caller,
    //         subaccount: None,
    //     }).unwrap()
    // );

    // let WasmResult::Reply(reply) = result.unwrap() else { unreachable!() };
    // let resp: Nat = decode_one(&reply).unwrap();
    // assert_eq!(resp, Nat::from(89_800_000u64));
}

fn load_wasm() -> Vec<u8> {
    let mut file_path = PathBuf::from(
        std::env::var("CARGO_MANIFEST_DIR").expect("Failed to read CARGO_MANIFEST_DIR env variable")
    );
    file_path.push("wasms");
    file_path.push("ogy_legacy_ledger_canister.wasm.gz");

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
