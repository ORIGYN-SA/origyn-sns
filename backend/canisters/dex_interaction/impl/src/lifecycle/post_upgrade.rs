use crate::lifecycle::init_canister;
use crate::memory::get_upgrades_memory;
use crate::migrations::types::state::RuntimeStateV0;
use crate::state::RuntimeState;
use bity_ic_canister_logger::LogEntry;
use bity_ic_canister_tracing_macros::trace;
use bity_ic_stable_memory::get_reader;
use candid::Principal;
use dex_interaction_api::exchange_job_config::ExchangeJobConfig;
use dex_interaction_api::icpswap::ICPSwapConfig;
use dex_interaction_api::swap_config::ExchangeConfig;
pub use dex_interaction_api::Args;
use ic_cdk_macros::post_upgrade;
use ic_ledger_types::Tokens;
use icrc_ledger_types::icrc1::account::Account;
use std::time::Duration;
use tracing::info;
use types::TokenSymbol;

#[post_upgrade]
#[trace]
fn post_upgrade(args: Args) {
    match args {
        Args::Init(_) =>
            panic!(
                "Cannot upgrade the canister with an Init argument. Please provide an Upgrade argument."
            ),
        Args::Upgrade(upgrade_args) => {
            info!("Post-upgrade starting with args: {:?}", upgrade_args);
            let memory = get_upgrades_memory();
            let reader = get_reader(&memory);

            // NOTE: uncomment these lines if you want to do a normal upgrade
            let (mut state, logs, traces): (RuntimeState, Vec<LogEntry>, Vec<LogEntry>) = bity_ic_serializer
                ::deserialize(reader)
                .unwrap();

            // NOTE: uncomment these lines if you want to do an upgrade with migration
            // let (runtime_state_v0, logs, traces): (
            //     RuntimeStateV0,
            //     Vec<LogEntry>,
            //     Vec<LogEntry>,
            // ) = bity_ic_serializer::deserialize(reader).unwrap();
            // let mut state = RuntimeState::from(runtime_state_v0);

            // NOTE: init exchange configs
            let sns_rewards_id = if state.env.is_test_mode() {
                Principal::from_text("fpmqz-aaaaa-aaaag-qjvua-cai").unwrap()
            } else {
                Principal::from_text("yuijc-oiaaa-aaaap-ahezq-cai").unwrap()
            };

            let mut exchange_configs: Vec<ExchangeJobConfig> = Vec::new();
            exchange_configs.push(ExchangeJobConfig{
                token_to_sell: TokenSymbol::GOLDAO,
                token_to_buy: TokenSymbol::OGY,
                exchange: ExchangeConfig::ICPSwap(ICPSwapConfig {
                    swap_canister_id: Principal::from_text("tblob-hiaaa-aaaag-qj2cq-cai").unwrap(),
                    zero_for_one: false,
                }),
                rate_per_interval: 2_380_950,
                job_interval_ms: Duration::from_secs(14400).as_millis() as u64, // 4 hours
                source_subaccount: Default::default(),
                min_amount: Tokens::from_e8s(10_000_000),
                max_amount: None,
                destination_account: Some(Account { owner: sns_rewards_id, subaccount: Some([
                    2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                ]) }), // all the GOLDAO burned from the 0 subaccount
            });

            // NOTE: uncomment this line to clear existing exchange jobs before adding new ones
            state.data.exchange_jobs.clear_exchange_jobs();

            for exchange_job_config in exchange_configs {
                let _ = state.data.exchange_jobs.add_exchange_job(exchange_job_config);
            }

            // end of migration code

            state.env.set_version(upgrade_args.version);
            state.env.set_commit_hash(upgrade_args.commit_hash);

            bity_ic_canister_logger::init_with_logs(state.env.is_test_mode(), logs, traces);
            init_canister(state);

            info!(version = %upgrade_args.version, "Post-upgrade complete");
        }
    }
}
