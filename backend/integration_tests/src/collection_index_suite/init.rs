use std::{ env, path::Path };
use candid::{ Nat, Principal };
use origyn_nft_reference::origyn_nft_reference_canister::ManageStorageRequestConfigureStorage;
use pocket_ic::{ PocketIc, PocketIcBuilder };
use collection_index_api::lifecycle::init::InitArgs as CollectionIndexInitArgs;
use types::CanisterId;
use utils::consts::E8S_FEE_OGY;

use crate::{
    client::pocket::{ create_canister, install_canister },
    collection_index_suite::{ nft_utils, PrincipalIds },
    utils::random_principal,
    wasms,
};

use super::{ CanisterIds, TestEnv };

pub static POCKET_IC_BIN: &str = "./pocket-ic";

pub fn init() -> TestEnv {
    validate_pocketic_installation();
    println!("install validate");

    // let mut pic: PocketIc = PocketIc::new();
    let mut pic = PocketIcBuilder::new()
        .with_application_subnet()
        .with_application_subnet()
        .with_sns_subnet()
        .with_fiduciary_subnet()
        .with_nns_subnet()
        .with_system_subnet()
        .build();

    let get_app_subnets = pic.topology().get_app_subnets()[1];

    println!("topology {:?}", pic.topology());
    println!("get_app_subnets {:?}", get_app_subnets.to_string());
    println!("pic set");

    let principal_ids: PrincipalIds = PrincipalIds {
        net_principal: random_principal(),
        controller: random_principal(),
        originator: random_principal(),
        nft_owner: random_principal(),
    };
    let canister_ids: CanisterIds = install_canisters(&mut pic, principal_ids.controller);
    println!("origyn_nft_one: {:?}", canister_ids.origyn_nft_one.to_string());
    println!("origyn_nft_two: {:?}", canister_ids.origyn_nft_two.to_string());

    init_origyn_nft(
        &mut pic,
        canister_ids.origyn_nft_one,
        principal_ids.controller,
        principal_ids.originator,
        principal_ids.net_principal,
        random_principal(), // placeholder for OGY ledger - not needed now,
        "Collection A".to_string()
    );

    init_origyn_nft(
        &mut pic,
        canister_ids.origyn_nft_two,
        principal_ids.controller,
        principal_ids.originator,
        principal_ids.net_principal,
        random_principal(), // placeholder for OGY ledger - not needed now,
        "Collection A".to_string()
    );
    TestEnv {
        pic,
        canister_ids,
        principal_ids,
    }
}

fn init_origyn_nft(
    pic: &mut PocketIc,
    canister: CanisterId,
    controller: Principal,
    originator: Principal,
    net_principal: Principal,
    ogy_principal: Principal,
    collection_name: String
) {
    let manage_storage_return: origyn_nft_reference::origyn_nft_reference_canister::ManageStorageResult = crate::client::origyn_nft_reference::client::manage_storage_nft_origyn(
        pic,
        canister,
        Some(controller),
        crate::client::origyn_nft_reference::manage_storage_nft_origyn::Args::ConfigureStorage(
            ManageStorageRequestConfigureStorage::Heap(Some(Nat::from(500000000 as u32)))
        )
    );

    println!("manage_storage_return: {:?}", manage_storage_return);

    let collection_update_return: origyn_nft_reference::origyn_nft_reference_canister::OrigynBoolResult = crate::client::origyn_nft_reference::client::collection_update_nft_origyn(
        pic,
        canister,
        Some(controller),
        crate::client::origyn_nft_reference::collection_update_nft_origyn::Args::UpdateOwner(
            net_principal
        )
    );
    println!("collection_update_return: {:?}", collection_update_return);

    // Update collection name to `collection_name``
    let collection_update_name_return: origyn_nft_reference::origyn_nft_reference_canister::OrigynBoolResult = crate::client::origyn_nft_reference::client::collection_update_nft_origyn(
        pic,
        canister,
        Some(net_principal),
        crate::client::origyn_nft_reference::collection_update_nft_origyn::Args::UpdateName(
            Some(collection_name)
        )
    );
    println!("collection_update_name_return: {:?}", collection_update_name_return);

    let collection = nft_utils::build_standard_collection(
        pic,
        canister.clone(),
        canister.clone(),
        originator.clone(),
        Nat::from(1024 as u32),
        net_principal.clone(),
        nft_utils::ICTokenSpec {
            canister: ogy_principal,
            fee: Some(Nat::from(E8S_FEE_OGY)),
            symbol: "OGY".to_string(),
            decimals: Nat::from(8 as u32),
            standard: nft_utils::TokenStandard::Ledger,
            id: None,
        }
    );
    println!("collection: {:?}", collection);
}

fn install_canisters(pic: &mut PocketIc, controller: Principal) -> CanisterIds {
    let origyn_nft_one_canister_id: Principal = create_canister(pic, controller);
    let origyn_nft_two_canister_id: Principal = create_canister(pic, controller);
    let collection_index_canister_id: Principal = create_canister(pic, controller);

    let origyn_nft_canister_wasm = wasms::ORIGYN_NFT.clone();
    let collection_index_canister_wasm = wasms::COLLECTION_INDEX.clone();

    install_canister(
        pic,
        controller,
        origyn_nft_one_canister_id,
        origyn_nft_canister_wasm.clone(),
        {}
    );
    install_canister(pic, controller, origyn_nft_two_canister_id, origyn_nft_canister_wasm, {});

    let collection_index_init_args = CollectionIndexInitArgs {
        authorized_principals: vec![controller],
        test_mode: true,
    };

    install_canister(
        pic,
        controller,
        collection_index_canister_id,
        collection_index_canister_wasm,
        collection_index_init_args
    );

    CanisterIds {
        origyn_nft_one: origyn_nft_one_canister_id,
        origyn_nft_two: origyn_nft_two_canister_id,
        collection_index: collection_index_canister_id,
    }
}

pub fn validate_pocketic_installation() {
    let path = POCKET_IC_BIN;

    if !Path::new(&path).exists() {
        println!(
            "
        Could not find the PocketIC binary to run canister integration tests.

        I looked for it at {:?}. You can specify another path with the environment variable POCKET_IC_BIN (note that I run from {:?}).
        ",
            &path,
            &env
                ::current_dir()
                .map(|x| x.display().to_string())
                .unwrap_or_else(|_| "an unknown directory".to_string())
        );
    }
}
