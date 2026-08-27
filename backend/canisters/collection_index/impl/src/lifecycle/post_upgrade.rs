use crate::migrations::types::state::RuntimeStateV0;
use bity_ic_canister_logger::LogEntry;
use bity_ic_canister_tracing_macros::trace;
use candid::Principal;
use bity_ic_stable_memory::get_reader;
pub use collection_index_api::Args;
use ic_cdk::post_upgrade;
use tracing::info;

use crate::{memory::get_upgrades_memory, state::RuntimeState};

use super::init_canister;

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
            // let (mut state, logs, traces): (RuntimeState, Vec<LogEntry>, Vec<LogEntry>) = bity_ic_serializer
            //     ::deserialize(reader)
            //     .unwrap();

            // NOTE: uncomment these lines if you want to do an upgrade with migration
            let (runtime_state_v0, logs, traces): (
                RuntimeStateV0,
                Vec<LogEntry>,
                Vec<LogEntry>,
            ) = bity_ic_serializer::deserialize(reader).unwrap();
            let mut state = RuntimeState::from(runtime_state_v0);

            let prices = vec![
                ("y2f5p-dqaaa-aaaas-qgfcq-cai", 2000),
                ("7jf63-xaaaa-aaaas-qgfrq-cai", 2000),
                ("3zrik-eiaaa-aaaas-qgr5a-cai", 10000),
                ("isivi-3aaaa-aaaas-qgs2q-cai", 10000),
                ("i4kya-aqaaa-aaaas-qgs3q-cai", 10000),
                ("jwf22-caaaa-aaaas-qgs4q-cai", 10000),
                ("avogm-kaaaa-aaaas-qgtmq-cai", 10000),
                ("a3mle-rqaaa-aaaas-qgtnq-cai", 10000),
                ("ajk45-5aaaa-aaaas-qgtoq-cai", 10000),
                ("mjjz5-rqaaa-aaaas-qgv6a-cai", 35000000),
                ("mhluv-kaaaa-aaaas-qgv7a-cai", 35000000),
                ("32gri-4qaaa-aaaas-qgwaa-cai", 35000000),
                ("3ue4a-haaaa-aaaas-qgwba-cai", 35000000),
                ("boqkn-4yaaa-aaaas-qguvq-cai", 7500),
            ];

            for (p_str, price) in prices {
                let p = Principal::from_text(p_str).unwrap();
                if let Some(mut col) = state.data.collections.collections.remove(&p) {
                    col.item_price_usd = Some(price);
                    state.data.collections.collections.insert(p, col);
                } else {
                    state.data.collections.collections.insert(
                        p,
                        collection_index_api::collection::CollectionExtended {
                            canister_id: p,
                            name: None,
                            category: None,
                            is_promoted: false,
                            total_supply: None,
                            item_price_usd: Some(price),
                        },
                    );
                }
            }

            state.env.set_version(upgrade_args.version);
            state.env.set_commit_hash(upgrade_args.commit_hash);

            bity_ic_canister_logger::init_with_logs(state.env.is_test_mode(), logs, traces);
            init_canister(state);

            info!(version = %upgrade_args.version, "Post-upgrade complete");
        }
    }
}
