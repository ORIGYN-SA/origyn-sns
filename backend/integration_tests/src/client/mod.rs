#![allow(dead_code)]
use crate::T;
use candid::{CandidType, Principal};
use pocket_ic::{PocketIc, UserError, WasmResult};
use serde::de::DeserializeOwned;
use types::CanisterId;

mod macros;

pub mod icrc1;
pub mod ogy_legacy_ledger;

const INIT_CYCLES_BALANCE: u128 = 1_000 * T;

pub fn create_canister(env: &mut PocketIc, controller: Principal) -> CanisterId {
    let canister_id = env.create_canister_with_settings(Some(controller), None);
    env.add_cycles(canister_id, INIT_CYCLES_BALANCE);
    canister_id
}

pub fn create_canister_with_id(
    env: &mut PocketIc,
    controller: Principal,
    canister_id: &str,
) -> CanisterId {
    let canister_id = canister_id.try_into().expect("Invalid canister ID");
    env.create_canister_with_id(Some(controller), None, canister_id)
        .expect("Create canister with ID failed");
    env.add_cycles(canister_id, INIT_CYCLES_BALANCE);
    canister_id
}

pub fn start_canister(env: &mut PocketIc, sender: Principal, canister_id: CanisterId) {
    env.start_canister(canister_id, Some(sender)).unwrap();
}

pub fn stop_canister(env: &mut PocketIc, sender: Principal, canister_id: CanisterId) {
    env.stop_canister(canister_id, Some(sender)).unwrap();
}

pub fn install_canister<P: CandidType>(
    env: &mut PocketIc,
    sender: Principal,
    canister_id: CanisterId,
    wasm: Vec<u8>,
    payload: P,
) {
    env.install_canister(
        canister_id,
        wasm,
        candid::encode_one(&payload).unwrap(),
        Some(sender),
    )
}

pub fn execute_query<P: CandidType, R: CandidType + DeserializeOwned>(
    env: &PocketIc,
    sender: Principal,
    canister_id: CanisterId,
    method_name: &str,
    payload: &P,
) -> R {
    unwrap_response(env.query_call(
        canister_id,
        sender,
        method_name,
        candid::encode_one(payload).unwrap(),
    ))
}

pub fn execute_update<P: CandidType, R: CandidType + DeserializeOwned>(
    env: &mut PocketIc,
    sender: Principal,
    canister_id: CanisterId,
    method_name: &str,
    payload: &P,
) -> R {
    unwrap_response(env.update_call(
        canister_id,
        sender,
        method_name,
        candid::encode_one(payload).unwrap(),
    ))
}

pub fn execute_update_no_response<P: CandidType>(
    env: &mut PocketIc,
    sender: Principal,
    canister_id: CanisterId,
    method_name: &str,
    payload: &P,
) {
    env.update_call(
        canister_id,
        sender,
        method_name,
        candid::encode_one(payload).unwrap(),
    )
    .unwrap();
}

fn unwrap_response<R: CandidType + DeserializeOwned>(response: Result<WasmResult, UserError>) -> R {
    match response.unwrap() {
        WasmResult::Reply(bytes) => candid::decode_one(&bytes).unwrap(),
        WasmResult::Reject(error) => panic!("{error}"),
    }
}
