//! Converges the managed SNS neurons towards the DAO's [`NeuronPolicy`].
//!
//! The planner is pure: it compares a snapshot of the neurons with the policy and returns
//! the `manage_neuron` commands needed to close the gap. It never plans a command the
//! controller lacks the permission for, never makes a neuron follow itself, and never
//! removes a permission from another principal that the controller does not hold itself.

use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use sns_governance_canister::types::{
    manage_neuron::{
        configure::Operation, ChangeAutoStakeMaturity, Command, Configure, Follow,
        RemoveNeuronPermissions, SetFollowing,
    },
    Followee, FolloweesForTopic, Neuron, NeuronId, NeuronPermissionList, NeuronPermissionType,
    Topic,
};
use sns_neuron_controller_api_canister::neuron_policy::NeuronPolicy;
use std::collections::BTreeSet;
use types::TimestampMillis;

/// One `manage_neuron` command needed to bring a neuron in line with the policy.
#[derive(Debug, Clone, PartialEq)]
pub struct PolicyAction {
    pub neuron_id: Vec<u8>,
    pub description: String,
    pub command: Command,
}

/// Result of comparing the neurons with the policy.
#[derive(Debug, Default, Clone, PartialEq)]
pub struct PolicyPlan {
    pub actions: Vec<PolicyAction>,
    /// Deviations that cannot be fixed because the controller lacks the permission.
    pub skipped: Vec<String>,
}

/// Outcome of the last enforcement run, kept in state and exposed in the metrics.
#[derive(CandidType, Serialize, Deserialize, Debug, Clone, PartialEq, Default)]
pub struct PolicyEnforcementReport {
    pub timestamp: TimestampMillis,
    pub neurons_checked: u32,
    pub actions_planned: u32,
    pub actions_succeeded: u32,
    pub skipped: Vec<String>,
    pub errors: Vec<String>,
}

pub fn has_permission(
    neuron: &Neuron,
    principal: &Principal,
    permission: NeuronPermissionType,
) -> bool {
    let wanted = permission as i32;
    neuron
        .permissions
        .iter()
        .any(|p| p.principal.as_ref() == Some(principal) && p.permission_type.contains(&wanted))
}

/// Plans the commands for every neuron. Per neuron the order is: following, auto-stake,
/// then permission removal, so a neuron is never left without its following or with the
/// controller as sole principal before the controller has finished configuring it.
pub fn plan_policy_actions(
    neurons: &[Neuron],
    policy: &NeuronPolicy,
    controller: &Principal,
) -> PolicyPlan {
    let mut plan = PolicyPlan::default();
    for neuron in neurons {
        let Some(id) = neuron.id.as_ref() else {
            continue;
        };
        let is_exempt = policy.exempt_neuron_ids.contains(&id.id);
        if !is_exempt {
            plan_following(neuron, id, policy, controller, &mut plan);
        }
        plan_auto_stake(neuron, id, policy, controller, &mut plan);
        if !is_exempt {
            plan_permissions(neuron, id, policy, controller, &mut plan);
        }
    }
    plan
}

fn plan_following(
    neuron: &Neuron,
    id: &NeuronId,
    policy: &NeuronPolicy,
    controller: &Principal,
    plan: &mut PolicyPlan,
) {
    if id.id == policy.followee_neuron_id {
        return;
    }

    let topics_in_line = Topic::ALL
        .iter()
        .all(|topic| follows_only(neuron, *topic, &policy.followee_neuron_id));
    let legacy_functions: Vec<u64> = neuron
        .followees
        .iter()
        .filter(|(_, followees)| !followees.followees.is_empty())
        .map(|(function_id, _)| *function_id)
        .collect();

    if topics_in_line && legacy_functions.is_empty() {
        return;
    }

    if !has_permission(neuron, controller, NeuronPermissionType::Vote) {
        plan.skipped.push(format!(
            "neuron {id}: following deviates from policy but the controller lacks the Vote permission"
        ));
        return;
    }

    if !topics_in_line {
        plan.actions.push(PolicyAction {
            neuron_id: id.id.clone(),
            description: "set topic following on all topics".to_string(),
            command: Command::SetFollowing(SetFollowing {
                topic_following: Topic::ALL
                    .iter()
                    .map(|topic| FolloweesForTopic {
                        topic: Some(*topic),
                        followees: vec![Followee {
                            neuron_id: Some(NeuronId {
                                id: policy.followee_neuron_id.clone(),
                            }),
                            alias: None,
                        }],
                    })
                    .collect(),
            }),
        });
    }

    // Legacy per-function following is redundant once every topic is covered; clear it so
    // the neuron's configuration has a single source of truth.
    for function_id in legacy_functions {
        plan.actions.push(PolicyAction {
            neuron_id: id.id.clone(),
            description: format!("clear legacy following for function {function_id}"),
            command: Command::Follow(Follow {
                function_id,
                followees: vec![],
            }),
        });
    }
}

fn plan_auto_stake(
    neuron: &Neuron,
    id: &NeuronId,
    policy: &NeuronPolicy,
    controller: &Principal,
    plan: &mut PolicyPlan,
) {
    if !policy.auto_stake_maturity || neuron.auto_stake_maturity == Some(true) {
        return;
    }
    if !has_permission(
        neuron,
        controller,
        NeuronPermissionType::ConfigureDissolveState,
    ) {
        plan.skipped.push(format!(
            "neuron {id}: auto-stake maturity is off but the controller lacks the ConfigureDissolveState permission"
        ));
        return;
    }
    plan.actions.push(PolicyAction {
        neuron_id: id.id.clone(),
        description: "enable auto-stake maturity".to_string(),
        command: Command::Configure(Configure {
            operation: Some(Operation::ChangeAutoStakeMaturity(
                ChangeAutoStakeMaturity {
                    requested_setting_for_auto_stake_maturity: true,
                },
            )),
        }),
    });
}

/// Removes every other principal from the neuron, one `RemoveNeuronPermissions` per
/// principal, listing exactly the permissions it holds so the entry disappears.
fn plan_permissions(
    neuron: &Neuron,
    id: &NeuronId,
    policy: &NeuronPolicy,
    controller: &Principal,
    plan: &mut PolicyPlan,
) {
    if !policy.exclusive_control {
        return;
    }
    let others: Vec<_> = neuron
        .permissions
        .iter()
        .filter(|p| p.principal.is_some() && p.principal.as_ref() != Some(controller))
        .collect();
    if others.is_empty() {
        return;
    }
    if !has_permission(neuron, controller, NeuronPermissionType::ManagePrincipals) {
        plan.skipped.push(format!(
            "neuron {id}: {} other principal(s) present but the controller lacks the ManagePrincipals permission",
            others.len()
        ));
        return;
    }

    let own: BTreeSet<i32> = neuron
        .permissions
        .iter()
        .filter(|p| p.principal.as_ref() == Some(controller))
        .flat_map(|p| p.permission_type.iter().copied())
        .collect();

    for other in others {
        let principal = other.principal.expect("filtered above");
        let not_held: Vec<i32> = other
            .permission_type
            .iter()
            .copied()
            .filter(|t| !own.contains(t))
            .collect();
        if !not_held.is_empty() {
            plan.skipped.push(format!(
                "neuron {id}: principal {principal} holds permissions {not_held:?} the controller does not; left in place"
            ));
            continue;
        }
        plan.actions.push(PolicyAction {
            neuron_id: id.id.clone(),
            description: format!("remove principal {principal}"),
            command: Command::RemoveNeuronPermissions(RemoveNeuronPermissions {
                principal_id: Some(principal),
                permissions_to_remove: Some(NeuronPermissionList {
                    permissions: other.permission_type.clone(),
                }),
            }),
        });
    }
}

/// True when the neuron follows exactly `followee` on `topic`.
fn follows_only(neuron: &Neuron, topic: Topic, followee: &[u8]) -> bool {
    let Some(topic_followees) = neuron.topic_followees.as_ref() else {
        return false;
    };
    let Some(for_topic) = topic_followees.topic_id_to_followees.get(&topic.id()) else {
        return false;
    };
    match for_topic.followees.as_slice() {
        [single] => single.neuron_id.as_ref().map(|n| n.id.as_slice()) == Some(followee),
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sns_governance_canister::types::{neuron::Followees, NeuronPermission, TopicFollowees};
    use std::collections::BTreeMap;

    const VOTE: i32 = NeuronPermissionType::Vote as i32;
    const CONFIGURE: i32 = NeuronPermissionType::ConfigureDissolveState as i32;
    const MANAGE_PRINCIPALS: i32 = NeuronPermissionType::ManagePrincipals as i32;
    const ALL_PERMISSIONS: [i32; 11] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    fn controller() -> Principal {
        Principal::from_text("piyk3-liaaa-aaaae-qjvsa-cai").unwrap()
    }

    fn hotkey() -> Principal {
        Principal::self_authenticating([1u8; 32])
    }

    fn other_full_controller() -> Principal {
        Principal::self_authenticating([2u8; 32])
    }

    fn neuron_id(byte: u8) -> Vec<u8> {
        vec![byte; 32]
    }

    fn permission(principal: Principal, permissions: &[i32]) -> NeuronPermission {
        NeuronPermission {
            principal: Some(principal),
            permission_type: permissions.to_vec(),
        }
    }

    fn neuron(byte: u8, permissions: &[i32]) -> Neuron {
        Neuron {
            id: Some(NeuronId {
                id: neuron_id(byte),
            }),
            permissions: vec![permission(controller(), permissions)],
            ..Neuron::default()
        }
    }

    fn policy() -> NeuronPolicy {
        NeuronPolicy {
            followee_neuron_id: neuron_id(0xAA),
            exempt_neuron_ids: vec![neuron_id(0xAA), neuron_id(0xBB)],
            auto_stake_maturity: true,
            exclusive_control: true,
        }
    }

    fn topic_following(followee: u8, topics: &[Topic]) -> TopicFollowees {
        TopicFollowees {
            topic_id_to_followees: topics
                .iter()
                .map(|topic| {
                    (
                        topic.id(),
                        FolloweesForTopic {
                            topic: Some(*topic),
                            followees: vec![Followee {
                                neuron_id: Some(NeuronId {
                                    id: neuron_id(followee),
                                }),
                                alias: None,
                            }],
                        },
                    )
                })
                .collect(),
        }
    }

    fn compliant_neuron(byte: u8) -> Neuron {
        let mut n = neuron(byte, &ALL_PERMISSIONS);
        n.topic_followees = Some(topic_following(0xAA, &Topic::ALL));
        n.auto_stake_maturity = Some(true);
        n
    }

    fn descriptions(plan: &PolicyPlan) -> Vec<&str> {
        plan.actions
            .iter()
            .map(|a| a.description.as_str())
            .collect()
    }

    #[test]
    fn compliant_neuron_needs_nothing() {
        let plan = plan_policy_actions(&[compliant_neuron(1)], &policy(), &controller());
        assert_eq!(plan, PolicyPlan::default());
    }

    #[test]
    fn legacy_only_neuron_gets_topic_following_then_legacy_cleared_then_auto_stake() {
        let mut n = neuron(1, &ALL_PERMISSIONS);
        n.followees = BTreeMap::from([
            (
                0,
                Followees {
                    followees: vec![NeuronId {
                        id: neuron_id(0xAA),
                    }],
                },
            ),
            (
                9,
                Followees {
                    followees: vec![NeuronId {
                        id: neuron_id(0xAA),
                    }],
                },
            ),
        ]);
        let plan = plan_policy_actions(&[n], &policy(), &controller());

        assert_eq!(
            descriptions(&plan),
            vec![
                "set topic following on all topics",
                "clear legacy following for function 0",
                "clear legacy following for function 9",
                "enable auto-stake maturity",
            ]
        );
        assert!(plan.skipped.is_empty());
        match &plan.actions[0].command {
            Command::SetFollowing(set) => {
                assert_eq!(set.topic_following.len(), 7);
                for f in &set.topic_following {
                    assert_eq!(f.followees.len(), 1);
                    assert_eq!(
                        f.followees[0].neuron_id.as_ref().unwrap().id,
                        neuron_id(0xAA)
                    );
                }
            }
            other => panic!("unexpected command {other:?}"),
        }
        match &plan.actions[1].command {
            Command::Follow(follow) => {
                assert_eq!(follow.function_id, 0);
                assert!(follow.followees.is_empty());
            }
            other => panic!("unexpected command {other:?}"),
        }
        match &plan.actions[3].command {
            Command::Configure(Configure {
                operation: Some(Operation::ChangeAutoStakeMaturity(change)),
            }) => assert!(change.requested_setting_for_auto_stake_maturity),
            other => panic!("unexpected command {other:?}"),
        }
    }

    #[test]
    fn wrong_followee_on_one_topic_is_reset() {
        let mut n = compliant_neuron(1);
        n.topic_followees = Some(topic_following(0xAA, &Topic::ALL[..6]));
        n.topic_followees
            .as_mut()
            .unwrap()
            .topic_id_to_followees
            .extend(topic_following(0xCC, &[Topic::CriticalDappOperations]).topic_id_to_followees);
        let plan = plan_policy_actions(&[n], &policy(), &controller());
        assert_eq!(
            descriptions(&plan),
            vec!["set topic following on all topics"]
        );
    }

    #[test]
    fn missing_topic_is_reset() {
        let mut n = compliant_neuron(1);
        n.topic_followees = Some(topic_following(0xAA, &Topic::ALL[..6]));
        let plan = plan_policy_actions(&[n], &policy(), &controller());
        assert_eq!(
            descriptions(&plan),
            vec!["set topic following on all topics"]
        );
    }

    #[test]
    fn extra_followee_on_a_topic_is_reset() {
        let mut n = compliant_neuron(1);
        n.topic_followees
            .as_mut()
            .unwrap()
            .topic_id_to_followees
            .get_mut(&Topic::Governance.id())
            .unwrap()
            .followees
            .push(Followee {
                neuron_id: Some(NeuronId {
                    id: neuron_id(0xCC),
                }),
                alias: None,
            });
        let plan = plan_policy_actions(&[n], &policy(), &controller());
        assert_eq!(
            descriptions(&plan),
            vec!["set topic following on all topics"]
        );
    }

    #[test]
    fn exempt_neurons_keep_following_and_principals_but_get_auto_stake() {
        let mut followee = neuron(0xAA, &ALL_PERMISSIONS);
        followee.permissions.push(permission(hotkey(), &[3, VOTE]));
        let mut hand_configured = neuron(0xBB, &ALL_PERMISSIONS);
        hand_configured
            .permissions
            .push(permission(other_full_controller(), &ALL_PERMISSIONS));
        let plan = plan_policy_actions(&[followee, hand_configured], &policy(), &controller());
        assert_eq!(
            descriptions(&plan),
            vec!["enable auto-stake maturity", "enable auto-stake maturity"]
        );
        assert_eq!(plan.actions[0].neuron_id, neuron_id(0xAA));
        assert_eq!(plan.actions[1].neuron_id, neuron_id(0xBB));
        assert!(plan.skipped.is_empty());
    }

    #[test]
    fn followee_never_follows_itself_even_when_not_exempt() {
        let mut p = policy();
        p.exempt_neuron_ids.clear();
        let mut followee = neuron(0xAA, &ALL_PERMISSIONS);
        followee.auto_stake_maturity = Some(true);
        let plan = plan_policy_actions(&[followee], &p, &controller());
        assert_eq!(plan, PolicyPlan::default());
    }

    #[test]
    fn missing_permissions_are_reported_not_acted_on() {
        let n = neuron(1, &[3]); // submit proposal only
        let plan = plan_policy_actions(&[n], &policy(), &controller());
        assert!(plan.actions.is_empty());
        assert_eq!(plan.skipped.len(), 2);
        assert!(plan.skipped[0].contains("Vote permission"));
        assert!(plan.skipped[1].contains("ConfigureDissolveState permission"));
    }

    #[test]
    fn vote_only_hotkey_can_fix_following_but_not_auto_stake() {
        let n = neuron(1, &[3, VOTE]);
        let plan = plan_policy_actions(&[n], &policy(), &controller());
        assert_eq!(
            descriptions(&plan),
            vec!["set topic following on all topics"]
        );
        assert_eq!(plan.skipped.len(), 1);
        assert!(plan.skipped[0].contains("ConfigureDissolveState"));
    }

    #[test]
    fn auto_stake_policy_off_leaves_maturity_setting_alone() {
        let mut p = policy();
        p.auto_stake_maturity = false;
        let mut n = compliant_neuron(1);
        n.auto_stake_maturity = Some(false);
        let plan = plan_policy_actions(&[n], &p, &controller());
        assert_eq!(plan, PolicyPlan::default());
    }

    #[test]
    fn exclusive_control_removes_every_other_principal_after_configuring() {
        let mut n = neuron(1, &ALL_PERMISSIONS);
        n.permissions.push(permission(hotkey(), &[3, VOTE]));
        n.permissions
            .push(permission(other_full_controller(), &ALL_PERMISSIONS));
        let plan = plan_policy_actions(&[n], &policy(), &controller());

        assert_eq!(
            descriptions(&plan),
            vec![
                "set topic following on all topics",
                "enable auto-stake maturity",
                format!("remove principal {}", hotkey()).as_str(),
                format!("remove principal {}", other_full_controller()).as_str(),
            ]
        );
        assert!(plan.skipped.is_empty());
        match &plan.actions[2].command {
            Command::RemoveNeuronPermissions(remove) => {
                assert_eq!(remove.principal_id, Some(hotkey()));
                assert_eq!(
                    remove.permissions_to_remove.as_ref().unwrap().permissions,
                    vec![3, VOTE]
                );
            }
            other => panic!("unexpected command {other:?}"),
        }
        match &plan.actions[3].command {
            Command::RemoveNeuronPermissions(remove) => {
                assert_eq!(remove.principal_id, Some(other_full_controller()));
                assert_eq!(
                    remove.permissions_to_remove.as_ref().unwrap().permissions,
                    ALL_PERMISSIONS.to_vec()
                );
            }
            other => panic!("unexpected command {other:?}"),
        }
        // The controller's own entry is never targeted.
        assert!(plan.actions.iter().all(|a| !matches!(
            &a.command,
            Command::RemoveNeuronPermissions(r) if r.principal_id == Some(controller())
        )));
    }

    #[test]
    fn exclusive_control_off_keeps_other_principals() {
        let mut p = policy();
        p.exclusive_control = false;
        let mut n = compliant_neuron(1);
        n.permissions.push(permission(hotkey(), &[3, VOTE]));
        let plan = plan_policy_actions(&[n], &p, &controller());
        assert_eq!(plan, PolicyPlan::default());
    }

    #[test]
    fn permission_the_controller_lacks_is_never_removed() {
        // Controller lacks ManageVotingPermission (10); the other principal has it.
        let mut n = compliant_neuron(1);
        n.permissions[0].permission_type = (0..10).collect();
        n.permissions.push(permission(hotkey(), &[3, VOTE]));
        n.permissions
            .push(permission(other_full_controller(), &ALL_PERMISSIONS));
        let plan = plan_policy_actions(&[n], &policy(), &controller());
        assert_eq!(
            descriptions(&plan),
            vec![format!("remove principal {}", hotkey()).as_str()]
        );
        assert_eq!(plan.skipped.len(), 1);
        assert!(plan.skipped[0].contains(&other_full_controller().to_string()));
        assert!(plan.skipped[0].contains("[10]"));
    }

    #[test]
    fn without_manage_principals_removal_is_reported_not_attempted() {
        let mut n = compliant_neuron(1);
        n.permissions[0].permission_type = vec![CONFIGURE, 3, VOTE];
        n.permissions.push(permission(hotkey(), &[3, VOTE]));
        let plan = plan_policy_actions(&[n], &policy(), &controller());
        assert!(plan.actions.is_empty());
        assert_eq!(plan.skipped.len(), 1);
        assert!(plan.skipped[0].contains("ManagePrincipals"));
        assert_eq!(MANAGE_PRINCIPALS, 2);
    }

    #[test]
    fn permission_check_requires_matching_principal() {
        let mut n = neuron(1, &[CONFIGURE]);
        n.permissions
            .push(permission(Principal::anonymous(), &[VOTE]));
        assert!(has_permission(
            &n,
            &controller(),
            NeuronPermissionType::ConfigureDissolveState
        ));
        assert!(!has_permission(
            &n,
            &controller(),
            NeuronPermissionType::Vote
        ));
    }
}
