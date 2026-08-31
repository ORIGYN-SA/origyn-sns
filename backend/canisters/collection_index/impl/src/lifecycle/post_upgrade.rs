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
            let (mut state, logs, traces): (RuntimeState, Vec<LogEntry>, Vec<LogEntry>) = bity_ic_serializer
                ::deserialize(reader)
                .unwrap();

            // // NOTE: uncomment these lines if you want to do an upgrade with migration
            // let (runtime_state_v0, logs, traces): (
            //     RuntimeStateV0,
            //     Vec<LogEntry>,
            //     Vec<LogEntry>,
            // ) = bity_ic_serializer::deserialize(reader).unwrap();
            // let mut state = RuntimeState::from(runtime_state_v0);

            // let arbitrary_collections = vec![
            //     ("nszbk-7iaaa-aaaap-abczq-cai", "Federitaly Classic", 36000),
            //     ("vrhlk-mqaaa-aaaap-ahw3q-cai", "00132-2022-01", 1445000),
            //     ("u3ijq-oaaaa-aaaap-ahw4q-cai", "00009-2022-01", 3420000),
            //     ("b6zbl-pqaaa-aaaap-ahzaq-cai", "00017-2022-01", 15000),
            //     ("bx2kx-zyaaa-aaaap-ahzba-cai", "00112-2022-01", 52500),
            //     ("bq3md-uaaaa-aaaap-ahzbq-cai", "01193-2022-01", 7500),
            //     ("qtmba-dyaaa-aaaap-akhgq-cai", "00296-2022-01", 75000),
            //     ("qo7hj-fqaaa-aaaap-akmvq-cai", "00051-2022-01", 187500),
            //     ("of6pp-2iaaa-aaaap-akoza-cai", "01092-2022-01", 30000),
            //     ("vnuik-tyaaa-aaaap-abyyq-cai", "MainCollection", 3150000),
            //     ("fu7xh-xiaaa-aaaap-ahg7q-cai", "Magritte", 6400000),
            //     ("3ue4a-haaaa-aaaas-qgwba-cai", "Suzanne Syz", 35000000),
            // ];

            // for (p_str, name, tvl) in arbitrary_collections {
            //     let p = Principal::from_text(p_str).unwrap();
            //     state.data.collections.arbitrary_collections_tvl.insert(
            //         p,
            //         collection_index_api::collection::Collection {
            //             canister_id: p,
            //             name: Some(name.to_string()),
            //             category: None,
            //             is_promoted: false,
            //             locked_value_usd: Some(tvl),
            //         },
            //     );
            // }

            // let prices = vec![
            //     ("y2f5p-dqaaa-aaaas-qgfcq-cai", "GUSTUS ITALIAE", 2000),
            //     ("7jf63-xaaaa-aaaas-qgfrq-cai", "Made In Italy", 2000),
            //     ("3zrik-eiaaa-aaaas-qgr5a-cai", "Orange Marble Statut", 10000),
            //     ("isivi-3aaaa-aaaas-qgs2q-cai", "White Marble Sculpture", 10000),
            //     ("i4kya-aqaaa-aaaas-qgs3q-cai", "Light Gray Sculpture", 10000),
            //     ("jwf22-caaaa-aaaas-qgs4q-cai", "Blue Marble Sculpture", 10000),
            //     ("avogm-kaaaa-aaaas-qgtmq-cai", "Dark Gray Marble Sculpture", 10000),
            //     ("a3mle-rqaaa-aaaas-qgtnq-cai", "Black Marble Sculpture", 10000),
            //     ("ajk45-5aaaa-aaaas-qgtoq-cai", "Orange Marble Sculpture", 10000),
            //     ("boqkn-4yaaa-aaaas-qguvq-cai", "WF01 Diamonds Full v2", 7500),
            // ];

            // for (p_str, name, price) in prices {
            //     let p = Principal::from_text(p_str).unwrap();
            //     if let Some(mut col) = state.data.collections.collections.remove(&p) {
            //         col.item_price_usd = Some(price);
            //         col.name = Some(name.to_string());
            //         state.data.collections.collections.insert(p, col);
            //     } else {
            //         state.data.collections.collections.insert(
            //             p,
            //             collection_index_api::collection::CollectionExtended {
            //                 canister_id: p,
            //                 name: Some(name.to_string()),
            //                 category: None,
            //                 is_promoted: false,
            //                 total_supply: None,
            //                 item_price_usd: Some(price),
            //             },
            //         );
            //     }
            // }

            state.env.set_version(upgrade_args.version);
            state.env.set_commit_hash(upgrade_args.commit_hash);

            bity_ic_canister_logger::init_with_logs(state.env.is_test_mode(), logs, traces);
            init_canister(state);

            info!(version = %upgrade_args.version, "Post-upgrade complete");
        }
    }
}
