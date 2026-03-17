use super::setup_rewards::setup_rewards_canister;
use crate::sns_test_env::sns_init_args::SnsProject;
use crate::sns_test_env::sns_test_env::SnsTestEnv;
use crate::sns_test_env::utils::generate_5y_neuron_data;
use crate::sns_test_env::{SnsConfig, TestEnvBuilder};
use crate::{client::icrc1::client::transfer, utils::random_principal, wasms};
use bity_ic_canister_time::HOUR_IN_MS;
use candid::{encode_one, Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use pocket_ic::PocketIc;
use sns_governance_canister::types::Neuron;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::time::{Duration, SystemTime};

pub fn setup_reward_pools(
    pic: &PocketIc,
    minting_account: &Principal,
    reward_canister_id: &Principal,
    canister_ids: &Vec<Principal>,
    amount: u64,
) {
    let reward_account = Account {
        owner: reward_canister_id.clone(),
        subaccount: Some([0u8; 32]),
    };

    for canister_id in canister_ids {
        transfer(
            pic,
            minting_account.clone(),
            canister_id.clone(),
            None,
            reward_account,
            amount,
        )
        .unwrap();
    }
}

pub struct RewardsTestEnv {
    pub pic: Rc<RefCell<PocketIc>>,
    pub controller: Principal,
    pub ogy_sns_test_env: SnsTestEnv,
    pub neuron_data: HashMap<usize, Neuron>,
    pub users: Vec<Principal>,
    pub token_ledgers: HashMap<String, Principal>,
    pub rewards_canister_id: Principal,
    pub sns_gov_canister_id: Principal,
    pub neuron_owners: HashMap<Principal, usize>,
}

impl RewardsTestEnv {
    /// Simulate neurons voting by reinstalling the SNS governance canister with increased maturity.
    pub fn simulate_neuron_voting(&self, multiplier: u64) {
        let pic = self.pic.borrow();
        let (neuron_data, _) =
            generate_5y_neuron_data(0, self.neuron_data.len(), multiplier, &self.users);
        pic.tick();
        self.ogy_sns_test_env
            .reinstall_governance_with_neuron_data(&neuron_data);
        pic.tick();
    }

    pub fn upgrade_rewards_canister(&self) {
        let pic = self.pic.borrow();
        match pic.upgrade_canister(
            self.rewards_canister_id,
            wasms::REWARDS.clone(),
            encode_one(()).unwrap(),
            Some(self.controller.clone()),
        ) {
            Ok(_) => println!("upgrade success"),
            Err(m) => println!("{m:?}"),
        }
    }
}

pub struct RewardsTestEnvBuilder {
    controller: Principal,
    users: Vec<Principal>,
    token_symbols: Vec<String>,
    initial_ledger_accounts: Vec<(Account, Nat)>,
    neurons_to_create: usize,
    initial_reward_pool_amount: Nat,
    ledger_fees: HashMap<String, Nat>,
}

impl RewardsTestEnvBuilder {
    pub fn new() -> Self {
        Self {
            controller: random_principal(),
            users: vec![],
            token_symbols: vec![],
            neurons_to_create: 0,
            initial_ledger_accounts: vec![],
            initial_reward_pool_amount: Nat::from(0u64),
            ledger_fees: HashMap::new(),
        }
    }

    /// Controller of everything — defaults to a random principal.
    pub fn add_controller(mut self, principal: Principal) -> Self {
        self.controller = principal;
        self
    }

    /// Users added as hotkeys to neurons, cycling through the list.
    pub fn add_users(mut self, users: Vec<Principal>) -> Self {
        self.users = users;
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

    pub fn add_random_neurons(mut self, amount: usize) -> Self {
        self.neurons_to_create = amount;
        self
    }

    /// Note: counts as a mint and therefore increases total supply.
    pub fn with_reward_pools(mut self, amount: Nat) -> Self {
        self.initial_reward_pool_amount = amount;
        self
    }

    pub fn build(self) -> RewardsTestEnv {
        let mut env = TestEnvBuilder::new()
            .with_controller(self.controller)
            .add_sns(SnsConfig::new(SnsProject::Ogy).with_initial_balances(vec![(
                sns_ledger_canister::types::Account {
                    owner: self.controller,
                    subaccount: None,
                },
                Nat::from(1_000_000_000_000_000u64),
            )]))
            .add_token_ledger_batch(
                self.token_symbols,
                self.initial_ledger_accounts,
                self.ledger_fees,
            )
            .build();

        // Tue Jun 18 2024 08:00:00 GMT
        env.pic
            .borrow()
            .set_time((SystemTime::UNIX_EPOCH + Duration::from_millis(1718697600000)).into());

        let ogy_env = env.take_sns(SnsProject::Ogy);
        let sns_gov_canister_id = ogy_env.test_env.governance_id;

        let mut token_ledgers = env.token_ledgers;
        token_ledgers.insert(
            "ogy_ledger_canister_id".to_string(),
            ogy_env.test_env.ledger_id,
        );

        let rewards_canister_id = setup_rewards_canister(
            &env.pic.borrow(),
            &token_ledgers,
            &sns_gov_canister_id,
            &env.controller,
        );

        if self.initial_reward_pool_amount > Nat::from(0u64) {
            let token_ledger_ids: Vec<Principal> = token_ledgers.values().cloned().collect();
            setup_reward_pools(
                &env.pic.borrow(),
                &sns_gov_canister_id,
                &rewards_canister_id,
                &token_ledger_ids,
                self.initial_reward_pool_amount.0.try_into().unwrap(),
            );
        }

        let (neuron_data, neuron_owners) =
            generate_5y_neuron_data(0, self.neurons_to_create, 1, &self.users);
        ogy_env
            .test_env
            .reinstall_governance_with_neuron_data(&neuron_data);

        // Tuesday Jun 18, 2024, 9:00:00 AM
        env.pic
            .borrow()
            .advance_time(Duration::from_millis(HOUR_IN_MS));
        for _ in 0..4 {
            env.pic.borrow().tick();
        }

        RewardsTestEnv {
            pic: env.pic,
            controller: env.controller,
            ogy_sns_test_env: ogy_env.test_env,
            neuron_data,
            users: self.users,
            token_ledgers,
            rewards_canister_id,
            sns_gov_canister_id,
            neuron_owners,
        }
    }
}
