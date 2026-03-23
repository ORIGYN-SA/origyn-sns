use crate::client::pocket::create_canister_with_id;
use crate::client::pocket::install_canister;
use crate::wasms;
use candid::Principal;
use collection_index_api::lifecycle::init::InitArgs as CollectionIndexInitArgs;
use pocket_ic::PocketIc;

pub fn setup(pic: &PocketIc, controller: Principal, canister_id: Principal) -> Principal {
    let canister_id = create_canister_with_id(pic, controller, canister_id);
    pic.add_cycles(canister_id, 20_000_000_000_000);

    let wasm = wasms::COLLECTION_INDEX.clone();

    let collection_index_init_args =
        collection_index_api::lifecycle::Args::Init(CollectionIndexInitArgs {
            authorized_principals: vec![controller],
            test_mode: true,
            version: bity_ic_types::BuildVersion::default(),
            commit_hash: "commit_hash".to_string(),
        });

    install_canister(
        pic,
        controller,
        canister_id,
        wasm,
        collection_index_init_args,
    );

    canister_id
}
