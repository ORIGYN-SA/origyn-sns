use crate::utils::tick_n_blocks;
use crate::wasms;
use bity_ic_ledger_utils::compute_neuron_staking_subaccount_bytes;
use candid::{encode_one, Principal};
use ic_management_canister_types::CanisterSettings;
use ic_nns_common::pb::v1::NeuronId;
use ic_nns_governance_api::Neuron;
use ic_nns_test_utils::common::{NnsInitPayloads, NnsInitPayloadsBuilder};
use nns_governance_canister::types::manage_neuron::Command;
use pocket_ic::PocketIc;
use std::cell::Ref;
use std::cell::RefCell;
use std::collections::BTreeMap;
use std::collections::HashMap;
use std::rc::Rc;
use std::time::Duration;

pub struct NnsTestEnv {
    pub pic: Rc<RefCell<PocketIc>>,
    pub controller: Principal,
    pub canister_ids: CanisterIds,
    pub nns_init_payload: NnsInitPayloads,
}

impl NnsTestEnv {
    pub fn submit_proposal(
        &self,
        neuron_owner: Principal,
        neuron_id: u64,
        proposal: nns_governance_canister::types::Proposal,
    ) {
        let pic = self.pic.borrow();

        println!(
            "Submitting proposal with neuron {:?}: {:?}",
            neuron_id, proposal
        );

        let manage_neuron = nns_governance_canister::types::ManageNeuron {
            id: Some(nns_governance_canister::types::NeuronId { id: neuron_id }),
            neuron_id_or_subaccount: None,
            command: Some(Command::MakeProposal(proposal)),
        };

        let _ = crate::client::nns_governance::manage_neuron(
            &pic,
            neuron_owner,
            self.canister_ids.governance_id,
            &manage_neuron,
        );

        pic.advance_time(std::time::Duration::from_secs(100));
        tick_n_blocks(&pic, 50);
    }

    pub fn vote_on_proposal(
        &self,
        neuron_owner: Principal,
        neuron_id: u64,
        proposal_id: u64,
        vote: bool,
    ) {
        let pic = self.pic.borrow();
        // Convert the boolean vote to the expected integer format
        // According to the IC documentation, 1 = yes (adopt), 2 = no (reject)
        let vote_value: i32 = if vote { 1 } else { 2 };

        println!(
            "Voting {} on proposal {} with neuron {}",
            if vote { "yes" } else { "no" },
            proposal_id,
            &neuron_id
        );

        // Call the register_vote method on the governance canister
        let manage_neuron = nns_governance_canister::types::ManageNeuron {
            id: Some(nns_governance_canister::types::NeuronId { id: neuron_id }),
            neuron_id_or_subaccount: None,
            command: Some(
                nns_governance_canister::types::manage_neuron::Command::RegisterVote(
                    nns_governance_canister::types::manage_neuron::RegisterVote {
                        proposal: Some(nns_governance_canister::types::ProposalId {
                            id: proposal_id,
                        }),
                        vote: vote_value,
                    },
                ),
            ),
        };

        let result = crate::client::nns_governance::manage_neuron(
            &pic,
            neuron_owner,
            self.canister_ids.governance_id,
            &manage_neuron,
        );

        println!("Vote result: {result:?}");

        // Advance time to simulate vote processing
        pic.advance_time(std::time::Duration::from_secs(100));
        tick_n_blocks(&pic, 50);
    }
}

#[derive(Debug, Clone)]
pub struct CanisterIds {
    pub lifeline_id: Principal, // Controller of the root canister
    pub root_id: Principal,     // Controller of the lifeline canister and all other canisters
    pub governance_id: Principal,
    pub registry_id: Principal,
    pub ledger_id: Principal,
    pub genesis_token_id: Principal,
    pub index_id: Principal,
    pub cycles_minting_id: Principal,
    pub nns_ui_id: Principal,
    pub sns_wasm_id: Principal,
}

impl Default for CanisterIds {
    fn default() -> Self {
        Self {
            lifeline_id: Principal::from_text("rno2w-sqaaa-aaaaa-aaacq-cai").unwrap(),
            root_id: Principal::from_text("r7inp-6aaaa-aaaaa-aaabq-cai").unwrap(),
            governance_id: Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai").unwrap(),
            registry_id: Principal::from_text("rwlgt-iiaaa-aaaaa-aaaaa-cai").unwrap(),
            ledger_id: Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap(),
            genesis_token_id: Principal::from_text("renrk-eyaaa-aaaaa-aaada-cai").unwrap(),
            index_id: Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai").unwrap(),
            cycles_minting_id: Principal::from_text("rkp4c-7iaaa-aaaaa-aaaca-cai").unwrap(),
            nns_ui_id: Principal::from_text("qoctq-giaaa-aaaaa-aaaea-cai").unwrap(),
            sns_wasm_id: Principal::from_text("qaa6y-5yaaa-aaaaa-aaafa-cai").unwrap(),
        }
    }
}

impl CanisterIds {
    pub fn create_all_canisters(&self, pic: Ref<'_, PocketIc>, controller: Principal) {
        let create_canister = |principal: Principal| {
            pic.create_canister_with_id(
                None,
                Some(CanisterSettings {
                    controllers: Some(vec![controller]),
                    compute_allocation: None,
                    memory_allocation: None,
                    freezing_threshold: None,
                    reserved_cycles_limit: None,
                    log_visibility: None,
                    wasm_memory_limit: None,
                    wasm_memory_threshold: None,
                    environment_variables: None,
                }),
                principal,
            )
            .expect("Failed to create canister");

            pic.add_cycles(principal, 1_000_000_000_000);
        };

        create_canister(self.lifeline_id);
        create_canister(self.root_id);
        create_canister(self.governance_id);
        create_canister(self.registry_id);
        create_canister(self.ledger_id);
        create_canister(self.genesis_token_id);
        create_canister(self.index_id);
        create_canister(self.cycles_minting_id);
        create_canister(self.nns_ui_id);
        create_canister(self.sns_wasm_id);
    }
}

#[derive(Clone)]
pub struct NnsTestEnvBuilder {
    pub pic: Rc<RefCell<PocketIc>>,
    pub controller: Principal,
    pub canister_ids: CanisterIds,
    pub neuron_data: HashMap<u64, Neuron>,
}

impl Default for NnsTestEnvBuilder {
    fn default() -> Self {
        Self {
            pic: Rc::new(RefCell::new(PocketIc::default())),
            controller: Principal::anonymous(),
            canister_ids: CanisterIds::default(),
            neuron_data: HashMap::new(),
        }
    }
}

impl NnsTestEnvBuilder {
    pub fn new(pic: Rc<RefCell<PocketIc>>, controller: Principal) -> Self {
        Self {
            pic,
            controller,
            canister_ids: CanisterIds::default(),
            neuron_data: HashMap::new(),
        }
    }

    pub fn with_controller(mut self, controller: Principal) -> Self {
        self.controller = controller;
        self
    }

    pub fn with_neuron_data(mut self, neuron_data: HashMap<u64, Neuron>) -> Self {
        self.neuron_data.extend(neuron_data);
        self
    }

    pub fn generate_cansiters(self) -> NnsTestEnv {
        let pic = self.pic.borrow();
        self.canister_ids.create_all_canisters(pic, self.controller);
        let pic = self.pic.borrow();

        let mut nns_init_payload_builder = NnsInitPayloadsBuilder::new();
        let mut nns_init_payload = nns_init_payload_builder.build();

        let NnsInitPayloads {
            lifeline,
            root,
            ledger,
            governance,
            registry,
            genesis_token,
            index,
            cycles_minting,
            sns_wasms,
            subnet_rental,
        } = &mut nns_init_payload;

        let neuron_data_with_neuron_keys: BTreeMap<u64, Neuron> = self
            .neuron_data
            .iter() // Iterate over the entries of the original map
            .map(|(key, value)| (*key, value.clone())) // Dereference key to get u64
            .collect();
        governance.neurons = neuron_data_with_neuron_keys;

        pic.install_canister(
            self.canister_ids.lifeline_id,
            wasms::NNS_LIFELINE.clone(),
            encode_one(lifeline).unwrap(),
            Some(self.controller.clone()),
        );

        pic.install_canister(
            self.canister_ids.root_id,
            wasms::NNS_ROOT.clone(),
            encode_one(root).unwrap(),
            Some(self.controller.clone()),
        );

        pic.install_canister(
            self.canister_ids.ledger_id,
            wasms::NNS_LEDGER.clone(),
            encode_one(ledger).unwrap(),
            Some(self.controller.clone()),
        );

        pic.install_canister(
            self.canister_ids.cycles_minting_id,
            wasms::NNS_CYCLES_MINTING.clone(),
            encode_one(cycles_minting).unwrap(),
            Some(self.controller.clone()),
        );

        pic.install_canister(
            self.canister_ids.governance_id,
            wasms::NNS_GOVERNANCE.clone(),
            encode_one(governance).unwrap(),
            Some(self.controller.clone()),
        );

        pic.install_canister(
            self.canister_ids.registry_id,
            wasms::NNS_REGISTRY.clone(),
            encode_one(registry).unwrap(),
            Some(self.controller.clone()),
        );

        // pic.install_canister(
        //     self.canister_ids.genesis_token_id,
        //     wasms::NNS_GENESIS_TOKEN.clone(),
        //     encode_one(genesis_token).unwrap(),
        //     Some(self.controller.clone()),
        // );

        pic.install_canister(
            self.canister_ids.index_id,
            wasms::NNS_INDEX.clone(),
            encode_one(index).unwrap(), // FIXME
            Some(self.controller.clone()),
        );

        pic.install_canister(
            self.canister_ids.sns_wasm_id,
            wasms::NNS_WASM_ID.clone(),
            encode_one(sns_wasms).unwrap(),
            Some(self.controller.clone()),
        );

        pic.advance_time(Duration::from_secs(100));
        tick_n_blocks(&pic, 100);

        NnsTestEnv {
            pic: self.pic.clone(),
            controller: self.controller,
            canister_ids: self.canister_ids,
            nns_init_payload,
        }
    }
}

/// Generates NNS neuron data for testing purposes
///
/// # Arguments
/// * `start_at` - Starting neuron ID (e.g., 0 or 1)
/// * `n` - Ending neuron ID (exclusive, so n=10 creates neurons 0-9)
/// * `maturity_multiplier` - Multiplier for neuron maturity (e.g., 1000000000 for 1B e8s)
/// * `users` - Vector of user principals who will own the neurons (cycles through them)
///
/// # Returns
/// * `HashMap<usize, Neuron>` - Map of neuron index to Neuron struct
/// * `HashMap<Principal, usize>` - Map of user principal to their neuron index
///
/// # Example
/// ```
/// let users = vec![
///     Principal::from_text("rdmx6-jaaaa-aaaaa-aaadq-cai").unwrap(),
///     Principal::from_text("renrk-eyaaa-aaaaa-aaada-cai").unwrap(),
/// ];
/// let (neurons, owner_map) = generate_nns_neuron_data(0, 4, 1000000000, &users);
/// // Creates 4 neurons (IDs 0,1,2,3) alternating between the two users
/// // Each neuron has computed subaccount using ledger_utils::compute_neuron_staking_subaccount_bytes
/// ```
pub fn generate_nns_neuron_data(
    start_at: usize,
    n: usize,
    maturity_multiplier: u64,
    users: &Vec<Principal>,
) -> (HashMap<usize, Neuron>, HashMap<Principal, usize>) {
    let mut neuron_data = HashMap::new();
    let mut owner_map = HashMap::new();
    let mut index_user = 0;
    for i in start_at..n {
        let neuron_id = NeuronId { id: i as u64 };
        let user_principal = users.get(index_user).clone();
        let neuron = create_nns_neuron(
            neuron_id,
            maturity_multiplier,
            user_principal.unwrap_or(&Principal::anonymous()),
        );
        neuron_data.insert(i, neuron);
        if user_principal.is_some() {
            owner_map.insert(user_principal.unwrap().clone(), i);
        }
        if !users.is_empty() {
            index_user = (index_user + 1) % users.len();
        }
    }

    (neuron_data, owner_map)
}

pub fn create_nns_neuron(id: NeuronId, maturity_multiplier: u64, controller: &Principal) -> Neuron {
    // Compute the subaccount for this neuron
    let subaccount = compute_neuron_staking_subaccount_bytes(*controller, id.id);

    Neuron {
        id: Some(id),
        cached_neuron_stake_e8s: 3000000000000u64,
        neuron_fees_e8s: 0u64,
        created_timestamp_seconds: 1620329630,
        aging_since_timestamp_seconds: u64::MAX,
        followees: HashMap::new(),
        maturity_e8s_equivalent: 1 * maturity_multiplier,
        staked_maturity_e8s_equivalent: Some(10),
        auto_stake_maturity: Some(false),
        dissolve_state: Some(
            ic_nns_governance_api::neuron::DissolveState::WhenDissolvedTimestampSeconds(
                100000000000,
            ),
        ),
        account: subaccount.to_vec(),
        controller: Some((*controller).into()),
        hot_keys: vec![],
        spawn_at_timestamp_seconds: None,
        recent_ballots: vec![],
        kyc_verified: true,
        transfer: None,
        not_for_profit: false,
        joined_community_fund_timestamp_seconds: None,
        known_neuron_data: None,
        neuron_type: None,
        visibility: None,
        voting_power_refreshed_timestamp_seconds: None,
        deciding_voting_power: None,
        potential_voting_power: None,
        maturity_disbursements_in_progress: None,
    }
}
