use crate::state::{Data, RuntimeState};
use ic_cdk_macros::init;
pub use token_metrics_api::lifecycle::Args;
use tracing::{error, info};
use utils::env::CanisterEnv;

use super::init_canister;

#[init]
fn init(args: Args) {
    match args {
        Args::Init(init_args) => {
            bity_ic_canister_logger::init(init_args.test_mode);

            let env = CanisterEnv::new(
                init_args.test_mode,
                init_args.version,
                init_args.commit_hash,
            );
            let data = Data::new(
                init_args.ogy_new_ledger_canister_id,
                init_args.sns_governance_canister_id,
                init_args.sns_rewards_canister_id,
                init_args.treasury_account,
                init_args.foundation_accounts,
                init_args.authorized_principals,
            );

            let runtime_state = RuntimeState::new(env, data);
            init_canister(runtime_state);

            // Auto-start ledger indexer after init completes.
            // Deferred to a timer because ic0_call_new is not allowed in init mode.
            let ledger_canister_id = init_args.ogy_new_ledger_canister_id;
            ic_cdk_timers::set_timer(std::time::Duration::from_secs(0), async move {
                let target = token_metrics_api::types::ledger_indexer::TargetArgs {
                    target_ledger: ledger_canister_id.to_text(),
                    hourly_size: 24,
                    daily_size: 30,
                };
                match crate::indexing::fetch_icrc2::t2_impl_set_target_canister(target).await {
                    Ok(msg) => {
                        info!("Ledger indexer initialized: {}", msg);
                        crate::jobs::sync_ledger::start_job();
                    }
                    Err(e) => {
                        error!("Failed to initialize ledger indexer: {}", e);
                        crate::jobs::record_job_error(
                            "sync_ledger",
                            &format!("Failed to initialize ledger indexer: {}", e),
                        );
                    }
                }
            });

            info!("Init complete.");
        }
        Args::Upgrade(_) => {
            panic!(
                "Cannot initialize the canister with an Upgrade argument. Please provide an Init argument."
            );
        }
    }
}
