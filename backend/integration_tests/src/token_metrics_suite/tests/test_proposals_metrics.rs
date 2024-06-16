use std::fmt::format;
use std::thread;
use std::time::Duration;

use sns_governance_canister::types::manage_neuron::Command;
use sns_governance_canister::types::proposal::Action;
use sns_governance_canister::types::{
    Empty,
    ManageNeuron,
    NeuronId,
    Proposal,
    RegisterDappCanisters,
};

use crate::client::sns_governance::{ list_proposals, manage_neuron };
use crate::client::token_metrics::get_proposals_metrics;
use crate::token_metrics_suite::init::default_test_setup;
use crate::utils::random_principal;

#[test]
fn test_proposals_metrics() {
    let setup = default_test_setup();
    let mut test_env = setup.sns_with_rewards_test_env;
    let token_metrics_canister_id = setup.token_metrics_canister_id;

    let sns_governance_canister_id = test_env.sns_gov_canister_id;
    //let token_metrics_canister_id = test_env.tok;

    let user_1 = test_env.users.get(0).unwrap().clone();
    let user_2 = test_env.users.get(1).unwrap().clone();
    let neuron_1 = test_env.neuron_data.get(&0usize).unwrap().clone();
    let neuron_id_1 = test_env.neuron_data.get(&0usize).unwrap().clone().id.unwrap();
    assert!(neuron_1.permissions.get(1).unwrap().principal == Some(user_1));

    for i in 1..3 {
        let proposal = Proposal {
            title: "Proposal 1".to_string(),
            summary: "Summary Proposal 1".to_string(),
            url: "https://origyn.com".to_string(),
            action: Some(
                Action::RegisterDappCanisters(RegisterDappCanisters {
                    canister_ids: vec![random_principal()],
                })
            ),
        };

        let manage_neuron_args1 = ManageNeuron {
            subaccount: neuron_id_1.id.clone(),
            command: Some(Command::MakeProposal(proposal)),
        };
        manage_neuron(&mut test_env.pic, user_1, sns_governance_canister_id, &manage_neuron_args1);

        // let msg = format!("{res:?}");
        // println!("Manage neuron res: {}", msg);
        let list_proposals_args = sns_governance_canister::list_proposals::Args {
            limit: 100,
            before_proposal: None,
            exclude_type: Vec::new(),
            include_status: Vec::new(),
            include_reward_status: Vec::new(),
        };
        let proposals_list = list_proposals(
            &mut test_env.pic,
            user_1,
            sns_governance_canister_id,
            &list_proposals_args
        );
        assert_eq!(proposals_list.proposals.len(), i);

        // Advance 5 minutes
        test_env.pic.advance_time(Duration::from_millis(5 * 60 * 1_000));

        // For some reason we need this
        for _ in 1..20 {
            test_env.pic.tick();
        }

        // Sleep 2 seconds
        thread::sleep(Duration::from_secs(2));

        let proposals_metrics = get_proposals_metrics(
            &mut test_env.pic,
            user_1,
            token_metrics_canister_id,
            &()
        );
        assert_eq!(proposals_metrics.total_proposals, i as u64);
    }
}
