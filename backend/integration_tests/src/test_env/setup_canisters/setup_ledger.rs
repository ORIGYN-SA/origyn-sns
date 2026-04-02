use crate::client::pocket::create_canister_with_id;
use crate::client::pocket::install_canister;
use crate::wasms;
use candid::{Nat, Principal};
use icrc_ledger_canister::init::{InitArgs, LedgerArgument};
use icrc_ledger_types::icrc1::account::Account;
use pocket_ic::PocketIc;
use types::TokenSymbol;

pub fn setup(
    pic: &PocketIc,
    controller: Principal,
    token: TokenSymbol,
    fee_collector: Option<Account>,
) -> Principal {
    let token_ticker = token.symbol().to_string();
    let token_info = token.get_prod_token_info();
    let canister_id = create_canister_with_id(pic, controller, token_info.ledger_id);
    pic.add_cycles(canister_id, 20_000_000_000_000);

    let wasm: Vec<u8> = wasms::IC_ICRC2_LEDGER.clone();

    let ledger_init_args = LedgerArgument::Init(InitArgs {
        fee_collector_account: fee_collector,
        minting_account: Account::from(controller),
        // initial_balances: vec![(Account::from(controller), Nat::from(100_000_000_000 as u64))],
        initial_balances: vec![],
        archive_options: icrc_ledger_canister::init::ArchiveOptions {
            trigger_threshold: 2000,
            num_blocks_to_archive: 1000,
            controller_id: controller,
        },
        metadata: vec![],
        transfer_fee: Nat::from(token_info.fee),
        token_symbol: token_ticker.clone(),
        token_name: token_ticker,
    });

    install_canister(pic, controller, canister_id, wasm, ledger_init_args);

    canister_id
}
