use ic_cdk_macros::init;
use tracing::info;
use types::{ TokenInfo, TokenSymbol };
use utils::env::CanisterEnv;

use crate::state::{ Data, RuntimeState };

use super::init_canister;
pub use sns_rewards_api_canister::init::*;

#[init]
fn init(args: InitArgs) {
    canister_logger::init(args.test_mode);

    let env = CanisterEnv::new(args.test_mode);
    let mut data = Data::default();

    let ogy_ledger_canister_id = args.sns_ledger_canister_id;

    if let Ok(token) = TokenSymbol::parse("OGY") {
        data.tokens.insert(token, TokenInfo {
            ledger_id: ogy_ledger_canister_id,
            fee: 200_000u64,
            decimals: 8u64,
        });
    }

    data.authorized_principals = vec![args.sns_gov_canister_id];
    data.sns_governance_canister = args.sns_gov_canister_id;

    let runtime_state = RuntimeState::new(env, data);

    init_canister(runtime_state);

    info!("Init complete.")
}
