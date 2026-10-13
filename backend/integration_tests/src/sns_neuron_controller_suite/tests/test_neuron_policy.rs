//! The controller converges its GOLDAO neurons towards the configured policy as part of the
//! daily job: topic following of the designated neuron on all topics, legacy following
//! cleared, auto-stake maturity on, and every principal other than the controller removed.
//! Exempt neurons keep their following and their principals.

use crate::client::sns_governance::get_neuron;
use crate::sns_test_env::sns_test_env::SnsProject;
use crate::sns_test_env::utils::generate_neuron_data;
use crate::test_env::test_env_builder::{SnsConfig, TestEnvBuilder};
use crate::utils::tick_n_blocks;
use candid::Principal;
use pocket_ic::PocketIc;
use sns_governance_canister::types::{
    get_neuron_response, neuron::Followees, GetNeuron, Neuron, NeuronId, NeuronPermission, Topic,
};
use sns_neuron_controller_api_canister::neuron_policy::NeuronPolicy;
use std::collections::HashMap;
use std::time::Duration;

const CONTROLLER_ID: &str = "piyk3-liaaa-aaaae-qjvsa-cai";

fn fetch_neuron(pic: &PocketIc, governance_id: Principal, id: &NeuronId) -> Neuron {
    let response = get_neuron(
        pic,
        Principal::anonymous(),
        governance_id,
        &GetNeuron {
            neuron_id: Some(id.clone()),
        },
    );
    match response.result {
        Some(get_neuron_response::Result::Neuron(neuron)) => neuron,
        _ => panic!("neuron {id} not found"),
    }
}

fn principals(neuron: &Neuron) -> Vec<Principal> {
    let mut p: Vec<Principal> = neuron
        .permissions
        .iter()
        .filter_map(|p| p.principal)
        .collect();
    p.sort();
    p
}

fn assert_follows_on_all_topics(neuron: &Neuron, followee: &NeuronId) {
    let topics = neuron
        .topic_followees
        .as_ref()
        .expect("topic following should be set");
    assert_eq!(topics.topic_id_to_followees.len(), Topic::ALL.len());
    for topic in Topic::ALL {
        let for_topic = &topics.topic_id_to_followees[&topic.id()];
        assert_eq!(for_topic.topic, Some(topic));
        assert_eq!(
            for_topic.followees.len(),
            1,
            "exactly one followee on {topic:?}"
        );
        assert_eq!(for_topic.followees[0].neuron_id.as_ref(), Some(followee));
    }
    assert!(
        neuron.followees.values().all(|f| f.followees.is_empty()),
        "legacy following should be cleared, got {:?}",
        neuron.followees
    );
}

fn assert_following_untouched(neuron: &Neuron) {
    assert!(
        neuron
            .topic_followees
            .as_ref()
            .map_or(true, |t| t.topic_id_to_followees.is_empty()),
        "exempt neuron must not get topic following"
    );
    assert!(neuron.followees.is_empty());
}

#[test]
fn test_neuron_policy_enforcement() {
    let controller = Principal::from_text(CONTROLLER_ID).unwrap();
    let hotkey = Principal::self_authenticating([7u8; 32]);
    let other_controller = Principal::self_authenticating([8u8; 32]);

    let (ogy_neuron_data, _) = generate_neuron_data(0, 1, 1, &vec![controller]);
    let (mut goldao_neuron_data, _) = generate_neuron_data(0, 4, 1, &vec![controller]);
    let ids: Vec<NeuronId> = (0..4)
        .map(|i| goldao_neuron_data[&i].id.clone().unwrap())
        .collect();

    // Neuron 3 starts with legacy per-function following, like most ORIGYN neurons today.
    let legacy = goldao_neuron_data.get_mut(&3).unwrap();
    for function_id in [0u64, 9] {
        legacy.followees.insert(
            function_id,
            Followees {
                followees: vec![ids[0].clone()],
            },
        );
    }
    // Neurons 1 (exempt), 2 and 3 carry a vote hotkey and a second full controller.
    for i in [1usize, 2, 3] {
        let neuron = goldao_neuron_data.get_mut(&i).unwrap();
        neuron.permissions.push(NeuronPermission {
            principal: Some(hotkey),
            permission_type: vec![3, 4],
        });
        neuron.permissions.push(NeuronPermission {
            principal: Some(other_controller),
            permission_type: vec![1, 2, 3, 4, 5, 6, 7, 8, 9],
        });
    }
    for neuron in goldao_neuron_data.values() {
        assert_eq!(neuron.auto_stake_maturity, Some(false));
        assert!(neuron.topic_followees.is_none());
    }

    let env = TestEnvBuilder::new()
        .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons(ogy_neuron_data))
        .add_sns(SnsConfig::new(SnsProject::GoldDao).with_neurons(goldao_neuron_data))
        .build();
    let pic = env.pic.borrow();
    let governance_id = env.get_sns(SnsProject::GoldDao).test_env.governance_id;

    // Neuron 0 is the hand-voted root; neuron 1 is hand-configured and left alone.
    let policy = NeuronPolicy {
        followee_neuron_id: ids[0].id.clone(),
        exempt_neuron_ids: vec![ids[0].id.clone(), ids[1].id.clone()],
        auto_stake_maturity: true,
        exclusive_control: true,
    };

    env.install_sns_neuron_controller_with_policy(
        controller,
        env.get_sns(SnsProject::Ogy).test_env.governance_id,
        governance_id,
        env.get_sns(SnsProject::GoldDao).test_env.ledger_id,
        Principal::from_text("iyehc-lqaaa-aaaap-ab25a-cai").unwrap(),
        HashMap::new(),
        Some(policy),
    );

    // The daily job runs right after installation.
    tick_n_blocks(&pic, 50);

    for i in [2usize, 3] {
        let neuron = fetch_neuron(&pic, governance_id, &ids[i]);
        assert_follows_on_all_topics(&neuron, &ids[0]);
        assert_eq!(neuron.auto_stake_maturity, Some(true), "neuron {i}");
        assert_eq!(
            principals(&neuron),
            vec![controller],
            "neuron {i} must be controlled by the canister alone"
        );
    }
    let mut expected_exempt_principals = vec![controller, hotkey, other_controller];
    expected_exempt_principals.sort();
    let root = fetch_neuron(&pic, governance_id, &ids[0]);
    assert_following_untouched(&root);
    assert_eq!(root.auto_stake_maturity, Some(true));
    assert_eq!(principals(&root), vec![controller]);
    let hand_configured = fetch_neuron(&pic, governance_id, &ids[1]);
    assert_following_untouched(&hand_configured);
    assert_eq!(hand_configured.auto_stake_maturity, Some(true));
    assert_eq!(principals(&hand_configured), expected_exempt_principals);

    // The next daily run finds nothing to do and leaves the neurons as they are.
    pic.advance_time(Duration::from_secs(24 * 60 * 60));
    tick_n_blocks(&pic, 50);
    for i in [2usize, 3] {
        let neuron = fetch_neuron(&pic, governance_id, &ids[i]);
        assert_follows_on_all_topics(&neuron, &ids[0]);
        assert_eq!(principals(&neuron), vec![controller]);
    }
    let hand_configured = fetch_neuron(&pic, governance_id, &ids[1]);
    assert_following_untouched(&hand_configured);
    assert_eq!(principals(&hand_configured), expected_exempt_principals);
}
