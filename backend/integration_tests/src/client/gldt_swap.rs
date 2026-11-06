use crate::{generate_pocket_query_call, generate_pocket_update_call};

use gldt_swap_api_canister::*;

generate_pocket_update_call!(_insert_fake_old_bulk_swaps);
generate_pocket_update_call!(_insert_fake_bulk_swaps);
generate_pocket_query_call!(get_active_swaps_by_user);
generate_pocket_update_call!(swap_tokens_for_nft);
generate_pocket_update_call!(recover_stuck_swap);
generate_pocket_query_call!(get_active_swap_ids_by_user);
generate_pocket_update_call!(swap_nft_for_tokens);
generate_pocket_update_call!(get_history_total);
generate_pocket_query_call!(get_owned_nfts);
generate_pocket_query_call!(http_request);
generate_pocket_update_call!(manual_gldt_supply_balance);
generate_pocket_update_call!(set_buyback_canister);
generate_pocket_update_call!(get_available_nfts);
generate_pocket_update_call!(get_available_nfts_for_canister);
generate_pocket_update_call!(get_active_swaps);
generate_pocket_query_call!(get_active_swaps_by_ids);

generate_pocket_query_call!(icrc3_get_properties);
generate_pocket_query_call!(icrc3_get_blocks);
generate_pocket_query_call!(icrc3_get_tip_certificate);
generate_pocket_query_call!(icrc3_supported_block_types);
generate_pocket_query_call!(icrc3_get_archives);

generate_pocket_query_call!(get_bridge_status);
generate_pocket_query_call!(get_bridge_evm_signers);
generate_pocket_update_call!(bridge_pause);
generate_pocket_update_call!(bridge_to_evm);
generate_pocket_query_call!(get_bridge_transfer_out);

/// Not built with `generate_pocket_query_call!`, which sends one Candid argument: this query
/// takes three (account, start, limit).
pub fn get_bridge_transfers_out_by_account(
    pic: &pocket_ic::PocketIc,
    sender: candid::Principal,
    canister_id: candid::Principal,
    args: &get_bridge_transfers_out_by_account::Args,
) -> get_bridge_transfers_out_by_account::Response {
    let (account, start, limit) = args;
    crate::client::pocket::unwrap_response(pic.query_call(
        canister_id,
        sender,
        "get_bridge_transfers_out_by_account",
        candid::encode_args((account, start, limit)).unwrap(),
    ))
}

/// The api module is `icrc21`, not the method name, so this is written out.
pub fn icrc21_canister_call_consent_message(
    pic: &pocket_ic::PocketIc,
    sender: candid::Principal,
    canister_id: candid::Principal,
    args: &icrc21::Args,
) -> icrc21::Response {
    crate::client::pocket::execute_query(
        pic,
        sender,
        canister_id,
        "icrc21_canister_call_consent_message",
        args,
    )
}
