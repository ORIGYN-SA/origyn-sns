use crate::setup::setup_sns::generate_neuron_data;
use crate::sns_neuron_controller_suite::setup::setup_ledger::setup_ledgers;
use crate::sns_neuron_controller_suite::setup::setup_rewards::setup_rewards_canister;
use crate::sns_neuron_controller_suite::setup::setup_sns_neuron_controller::setup_sns_neuron_controller_canister;
use crate::sns_neuron_controller_suite::setup::*;
// use crate::sns_test_env::nns_test_env::generate_nns_neuron_data;
// use crate::sns_test_env::nns_test_env::NnsTestEnv;
// use crate::sns_test_env::nns_test_env::NnsTestEnvBuilder;
use crate::sns_test_env::sns_init_args::generate_sns_neuron_data;
use crate::sns_test_env::sns_init_args::SnsInitArgs;
use crate::sns_test_env::sns_test_env::SnsTestEnv;
use crate::utils::random_principal;
use crate::utils::tick_n_blocks;
use bity_ic_types::BuildVersion;
use candid::CandidType;
use candid::Deserialize;
use candid::Principal;
use icrc_ledger_types::icrc1::account::Account;
use pocket_ic::{PocketIc, PocketIcBuilder};
use sns_governance_canister::types::Neuron;
use sns_neuron_controller_api_canister::Args;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::time::Duration;
use types::CanisterId;

#[derive(CandidType, Deserialize, Debug)]
pub struct RegisterDappCanisterRequest {
    pub canister_id: Option<Principal>,
}

pub struct SNCTestEnv {
    // NOTE: Pic is stored inside this struct
    pub pic: Rc<RefCell<PocketIc>>,
    pub controller: Principal,
    // pub nns_test_env: NnsTestEnv,
    pub ogy_sns_test_env: SnsTestEnv,
    pub goldao_sns_test_env: SnsTestEnv,
    pub ogy_neuron_data: HashMap<usize, Neuron>,
    pub goldao_neuron_data: HashMap<usize, Neuron>,
    // pub icp_neuron_data: HashMap<usize, ic_nns_governance_api::Neuron>,
    pub sns_neuron_controller_id: CanisterId,
    pub ogy_rewards_canister_id: CanisterId,
    pub goldao_rewards_canister_id: CanisterId,
    pub rewards_destination: CanisterId, // could be mocked
}

impl SNCTestEnv {
    pub fn get_pic(&self) -> std::cell::Ref<PocketIc> {
        self.pic.borrow()
    }
}

use std::fmt;
use std::fmt::Debug;
use std::fmt::Formatter;
impl Debug for SNCTestEnv {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.debug_struct("SNCTestEnv")
            .field("controller", &self.controller.to_text())
            .field(
                "sns_neuron_controller_id",
                &self.sns_neuron_controller_id.to_text(),
            )
            .field("ogy_sns_test_env", &self.ogy_sns_test_env)
            .field("ogy_sns_test_env", &self.goldao_sns_test_env)
            .field(
                "ogy_rewards_canister_id",
                &self.ogy_rewards_canister_id.to_text(),
            )
            .field("rewards_destination", &self.rewards_destination.to_text())
            .finish()
    }
}

pub struct SNCTestEnvBuilder {
    controller: Principal,
    token_symbols: Vec<String>,
    // Canister ids parameters
    sns_neuron_controller_id: CanisterId,
    ogy_rewards_canister_id: CanisterId,
    goldao_rewards_canister_id: CanisterId,
    rewards_destination: CanisterId, // could be mocked
    // Ledger parameters
    initial_ledger_accounts: Vec<(Account, Nat)>,
    ledger_fees: HashMap<String, Nat>,
    // Marker to check whether the neuron data needs to be pre-generated
    with_sns_neuron_data: bool,
    with_nns_neuron_data: bool,

    with_neuron_data: bool,
    with_other_user_neuron_data: bool,
}

impl Default for SNCTestEnvBuilder {
    fn default() -> Self {
        Self {
            controller: random_principal(),
            sns_neuron_controller_id: Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            ogy_rewards_canister_id: Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            goldao_rewards_canister_id: Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            rewards_destination: Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
            token_symbols: vec![],
            initial_ledger_accounts: vec![],
            ledger_fees: HashMap::new(),
            with_sns_neuron_data: false,
            with_nns_neuron_data: false,

            with_neuron_data: false,
            with_other_user_neuron_data: false,
        }
    }
}

impl SNCTestEnvBuilder {
    pub fn new() -> Self {
        SNCTestEnvBuilder::default()
    }

    pub fn with_controller(mut self, principal: Principal) -> Self {
        self.controller = principal;
        self
    }

    pub fn with_sns_neuron_data(mut self) -> Self {
        self.with_sns_neuron_data = true;
        self
    }

    pub fn with_nns_neuron_data(mut self) -> Self {
        self.with_nns_neuron_data = true;
        self
    }

    pub fn add_token_ledger(
        mut self,
        symbol: &str,
        initial_balances: &mut Vec<(Account, Nat)>,
        transaction_fee: Nat,
    ) -> Self {
        self.token_symbols.push(symbol.to_string());
        self.initial_ledger_accounts.append(initial_balances);
        self.ledger_fees.insert(symbol.to_string(), transaction_fee);
        self
    }

    // pub fn build(&mut self) -> SNCTestEnv {
    //     let pic_ref = Rc::new(RefCell::new(
    //         PocketIcBuilder::new()
    //             .with_nns_subnet()
    //             .with_sns_subnet()
    //             .with_application_subnet()
    //             .build(),
    //     ));
    //     let pic = pic_ref.borrow();
    //     let sns_subnet = pic.topology().get_sns().unwrap();

    //     self.ogy_rewards_canister_id =
    //         pic.create_canister_on_subnet(Some(self.controller.clone()), None, sns_subnet);
    //     self.goldao_rewards_canister_id =
    //         pic.create_canister_on_subnet(Some(self.controller.clone()), None, sns_subnet);
    //     self.sns_neuron_controller_id =
    //         pic.create_canister_on_subnet(Some(self.controller.clone()), None, sns_subnet);
    //     self.rewards_destination =
    //         pic.create_canister_on_subnet(Some(self.controller.clone()), None, sns_subnet);

    //     // NOTE: Neuron Permissions should be granted to the controller
    //     let mut ogy_neuron_data = HashMap::new();
    //     let mut goldao_neuron_data = HashMap::new();
    //     if self.with_sns_neuron_data == true {
    //         (ogy_neuron_data, _) =
    //             generate_sns_neuron_data(0, 1, 1, &vec![self.sns_neuron_controller_id]);
    //         (goldao_neuron_data, _) =
    //             generate_sns_neuron_data(0, 1, 1, &vec![self.sns_neuron_controller_id]);
    //     }

    //     let mut icp_neuron_data = HashMap::new();
    //     if self.with_nns_neuron_data == true {
    //         (icp_neuron_data, _) =
    //             generate_nns_neuron_data(0, 1, 150_000_000, &vec![self.sns_neuron_controller_id]);
    //     }

    //     let nns_test_env = {
    //         let mut builder = NnsTestEnvBuilder::new(pic_ref.clone(), self.controller.clone());
    //         if self.with_nns_neuron_data == true {
    //             // Convert HashMap<usize, Neuron> to HashMap<u64, Neuron>
    //             let neuron_data_u64: HashMap<u64, ic_nns_governance_api::Neuron> =
    //                 icp_neuron_data
    //                     .iter()
    //                     .map(|(k, v)| (*k as u64, v.clone()))
    //                     .collect();
    //             builder = builder.with_neuron_data(neuron_data_u64);
    //         }
    //         builder.generate_cansiters()
    //     };

    //     // let (ogy_init_args, ogy_canister_ids) =
    //     //     SnsInitArgs::new(&pic, &ogy_neuron_data, self.controller.clone());
    //                 let (ogy_neuron_data, neuron_owners) =
    //         generate_neuron_data(0, self.neurons_to_create, 1, &self.users);
    //     let ogy_sns_test_env = SnsTestEnv::ogy(
    //         &pic_ref,
    //         self.controller,
    //         ogy_init_args.with_token("OGY", 200_000),
    //         ogy_canister_ids,
    //     );

    //     let (goldao_init_args, goldao_canister_ids) =
    //         SnsInitArgs::new(&pic, &goldao_neuron_data, self.controller.clone());
    //     let goldao_sns_test_env = SnsTestEnv::new(
    //         &pic_ref,
    //         self.controller,
    //         goldao_init_args,
    //         goldao_canister_ids,
    //     );

    //     let ogy_sns_ledger_canister_id = ogy_sns_test_env.canister_ids.ledger_id;
    //     println!(
    //         "ogy_sns_ledger_canister_id: {:?}",
    //         ogy_sns_ledger_canister_id
    //     );
    //     let goldao_sns_ledger_canister_id = goldao_sns_test_env.canister_ids.ledger_id;
    //     println!(
    //         "ogy_sns_ledger_canister_id: {:?}",
    //         ogy_sns_ledger_canister_id
    //     );

    //     let mut token_ledgers = setup_ledgers(
    //         &pic,
    //         self.controller.clone(),
    //         self.token_symbols.clone(),
    //         self.initial_ledger_accounts.clone(),
    //         self.ledger_fees.clone(),
    //     );
    //     token_ledgers.insert(
    //         "ogy_ledger_canister_id".to_string(),
    //         ogy_sns_ledger_canister_id,
    //     );
    //     token_ledgers.insert(
    //         "gldgov_ledger_canister_id".to_string(),
    //         goldao_sns_ledger_canister_id,
    //     );

    //     self.goldao_rewards_canister_id = setup_rewards_canister(
    //         &pic,
    //         self.goldao_rewards_canister_id,
    //         &token_ledgers,
    //         goldao_sns_test_env.canister_ids.governance_id,
    //         &self.controller,
    //     );

    //     self.ogy_rewards_canister_id = setup_rewards_canister(
    //         &pic,
    //         self.ogy_rewards_canister_id,
    //         &token_ledgers,
    //         ogy_sns_test_env.canister_ids.governance_id,
    //         &self.controller,
    //     );

    //     let snc_init_args = Args::Init(sns_neuron_controller_api_canister::init::InitArgs {
    //         test_mode: true,
    //         version: BuildVersion::min(),
    //         commit_hash: "integration_testing".to_string(),
    //         authorized_principals: vec![
    //             self.controller,
    //             ogy_sns_test_env.canister_ids.governance_id,
    //             goldao_sns_test_env.canister_ids.governance_id,
    //         ],
    //         rewards_destination: Some(self.rewards_destination),
    //         ogy_manager_config: sns_neuron_controller_api_canister::init::OgyManagerConfig {
    //             ogy_sns_governance_canister_id: ogy_sns_test_env.canister_ids.governance_id,
    //             ogy_sns_ledger_canister_id,
    //             ogy_sns_rewards_canister_id: self.ogy_rewards_canister_id,
    //             ogy_rewards_threshold: Nat::from(100_000_000_000_000_u64),
    //         },
    //         goldao_manager_config: sns_neuron_controller_api_canister::init::GoldaoManagerConfig {
    //             goldao_sns_governance_canister_id: goldao_sns_test_env.canister_ids.governance_id,
    //             goldao_sns_ledger_canister_id,
    //             goldao_sns_rewards_canister_id: self.goldao_rewards_canister_id,
    //             goldao_rewards_threshold: Nat::from(3_000_000_000_000_u64),
    //         },
    //         icp_manager_config: sns_neuron_controller_api_canister::init::IcpManagerConfig {
    //             nns_governance_canister_id: nns_test_env.canister_ids.governance_id,
    //             nns_ledger_canister_id: nns_test_env.canister_ids.ledger_id,
    //             icp_rewards_threshold: Nat::from(10_000_u64),
    //         },
    //     });

    //     let snc_canister_id = setup_sns_neuron_controller_canister(
    //         &pic,
    //         self.sns_neuron_controller_id,
    //         snc_init_args,
    //         self.controller,
    //     );

    //     SNCTestEnv {
    //         pic: Rc::clone(&pic_ref),
    //         controller: self.controller,
    //         ogy_neuron_data,
    //         goldao_neuron_data,
    //         icp_neuron_data,
    //         nns_test_env,
    //         ogy_sns_test_env,
    //         goldao_sns_test_env,
    //         sns_neuron_controller_id: snc_canister_id,
    //         ogy_rewards_canister_id: self.ogy_rewards_canister_id,
    //         goldao_rewards_canister_id: self.goldao_rewards_canister_id,
    //         rewards_destination: self.rewards_destination,
    //     }
    // }

    pub fn build(&mut self) -> SNCTestEnv {
        let pic_ref = Rc::new(RefCell::new(
            PocketIcBuilder::new()
                .with_nns_subnet()
                .with_sns_subnet()
                .with_application_subnet()
                .build(),
        ));
        let pic = pic_ref.borrow();
        let sns_subnet = pic.topology().get_sns().unwrap();

        // TODO: impl with method in sns_test_env
        self.ogy_rewards_canister_id =
            pic.create_canister_on_subnet(Some(self.controller.clone()), None, sns_subnet);
        self.sns_neuron_controller_id =
            pic.create_canister_on_subnet(Some(self.controller.clone()), None, sns_subnet);
        self.ogy_rewards_canister_id =
            pic.create_canister_on_subnet(Some(self.controller.clone()), None, sns_subnet);

        let mut ogy_neuron_data = HashMap::new();
        let mut goldao_neuron_data = HashMap::new();
        if self.with_neuron_data == true {
            (ogy_neuron_data, _) =
                generate_neuron_data(0, 1, 1, &vec![self.sns_neuron_controller_id]);
            (goldao_neuron_data, _) =
                generate_neuron_data(0, 1, 1, &vec![self.sns_neuron_controller_id]);
        }

        let mut wtn_neuron_data = HashMap::new();
        if self.with_other_user_neuron_data == true {
            // (neuron_data, _) = generate_neuron_data(0, 20, 1, &vec![self.controller]);

            (wtn_neuron_data, _) =
                generate_neuron_data(0, 1, 1000000000, &vec![self.sns_neuron_controller_id]);
            pic.advance_time(Duration::from_secs(100));
            tick_n_blocks(&pic, 50);
        }

        let ogy_sns_test_env = SnsTestEnv::ogy(&pic_ref, self.controller, &ogy_neuron_data, None);
        let wtn_sns_test_env = SnsTestEnv::wtn(&pic_ref, self.controller, &wtn_neuron_data, None);
        let goldao_sns_test_env =
            SnsTestEnv::goldao(&pic_ref, self.controller, &wtn_neuron_data, None);

        let ogy_sns_ledger_canister_id = ogy_sns_test_env.ledger_id;
        let goldao_sns_ledger_canister_id = goldao_sns_test_env.ledger_id;

        let mut token_ledgers = setup_ledgers(
            &pic,
            self.controller.clone(),
            self.token_symbols.clone(),
            self.initial_ledger_accounts.clone(),
            self.ledger_fees.clone(),
        );
        token_ledgers.insert(
            "ogy_ledger_canister_id".to_string(),
            ogy_sns_test_env.ledger_id,
        );
        token_ledgers.insert(
            "wtn_ledger_canister_id".to_string(),
            wtn_sns_test_env.ledger_id,
        );

        let ogy_sns_rewards_canister_id = setup_rewards_canister(
            &pic_ref.borrow(),
            self.ogy_rewards_canister_id,
            &token_ledgers,
            ogy_sns_test_env.governance_id,
            &self.controller,
        );

        let snc_init_args = Args::Init(sns_neuron_controller_api_canister::init::InitArgs {
            test_mode: true,
            version: BuildVersion::min(),
            commit_hash: "integration_testing".to_string(),
            authorized_principals: vec![
                self.controller,
                ogy_sns_test_env.governance_id,
                ogy_sns_test_env.governance_id,
            ],
            rewards_destination: Some(self.rewards_destination),
            ogy_manager_config: sns_neuron_controller_api_canister::init::OgyManagerConfig {
                ogy_sns_governance_canister_id: ogy_sns_test_env.governance_id,
                ogy_sns_ledger_canister_id,
                ogy_sns_rewards_canister_id: self.ogy_rewards_canister_id,
                ogy_rewards_threshold: Nat::from(100_000_000_000_000_u64),
            },
            goldao_manager_config: sns_neuron_controller_api_canister::init::GoldaoManagerConfig {
                goldao_sns_governance_canister_id: goldao_sns_test_env.governance_id,
                goldao_sns_ledger_canister_id,
                goldao_sns_rewards_canister_id: self.goldao_rewards_canister_id,
                goldao_rewards_threshold: Nat::from(3_000_000_000_000_u64),
            },
            icp_manager_config: sns_neuron_controller_api_canister::init::IcpManagerConfig {
                nns_governance_canister_id: Principal::anonymous(),
                nns_ledger_canister_id: Principal::anonymous(),
                icp_rewards_threshold: Nat::from(10_000_u64),
            },
        });

        let snc_canister_id = setup_sns_neuron_controller_canister(
            &pic_ref.borrow(),
            self.sns_neuron_controller_id,
            snc_init_args,
            self.controller,
        );

        println!("snc_canister_id: {}", snc_canister_id);

        pic.advance_time(Duration::from_secs(100));
        tick_n_blocks(&pic, 50);

        // SNCTestEnv {
        //     pic: Rc::clone(&pic_ref),
        //     controller: self.controller,
        //     token_ledgers,
        //     sns_neuron_controller_id: snc_canister_id,
        //     wtn_neuron_data,
        //     ogy_neuron_data,
        //     ogy_sns_test_env: ogy_sns_test_env,
        //     wtn_sns_test_env: wtn_sns_test_env,
        //     ogy_rewards_canister_id: ogy_sns_rewards_canister_id,
        //     gld_rewards_canister_id: self.gld_rewards_canister_id,
        // }
        SNCTestEnv {
            pic: Rc::clone(&pic_ref),
            controller: self.controller,
            ogy_neuron_data,
            goldao_neuron_data,
            // icp_neuron_data,
            // nns_test_env,
            ogy_sns_test_env,
            goldao_sns_test_env,
            sns_neuron_controller_id: snc_canister_id,
            ogy_rewards_canister_id: self.ogy_rewards_canister_id,
            goldao_rewards_canister_id: self.goldao_rewards_canister_id,
            rewards_destination: self.rewards_destination,
        }
    }
}
