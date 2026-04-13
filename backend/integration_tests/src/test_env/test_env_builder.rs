use crate::sns_test_env::sns_init_args::{generate_sns_neuron_data, SnsProject};
use crate::sns_test_env::sns_test_env::SnsTestEnv;
use crate::test_env::setup_canisters::*;
use crate::utils::{random_principal, tick_n_blocks};
use bity_ic_types::Hash;
use candid::{Nat, Principal};
use dex_interaction_api::Args as BuybackBurnArgs;
use pocket_ic::PocketIcBuilder;
use sns_governance_canister::types::Neuron;
use sns_ledger_canister::types::Account as LedgerAccount;
use sns_neuron_controller_api_canister::Args as SncArgs;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::time::Duration;
use std::time::SystemTime;
use types::TokenSymbol;

/// Describes a single SNS to spin up, with optional neuron data and initial ledger balances.
pub struct SnsConfig {
    pub project: SnsProject,
    pub neurons: HashMap<usize, Neuron>,
    pub initial_balances: Option<Vec<(LedgerAccount, Nat)>>,
}

impl SnsConfig {
    pub fn new(project: SnsProject) -> Self {
        Self {
            project,
            neurons: HashMap::new(),
            initial_balances: None,
        }
    }

    pub fn with_neurons(mut self, neurons: HashMap<usize, Neuron>) -> Self {
        self.neurons = neurons;
        self
    }

    pub fn with_initial_balances(mut self, balances: Vec<(LedgerAccount, Nat)>) -> Self {
        self.initial_balances = Some(balances);
        self
    }
}

/// A single SNS environment produced by `TestEnvBuilder`.
pub struct SnsEnv {
    pub test_env: SnsTestEnv,
    /// Neuron data keyed by index, populated when `SnsConfig::with_neurons` is true.
    pub neuron_data: HashMap<usize, Neuron>,
}

/// Result of `TestEnvBuilder::build`.
///
/// Holds the shared `PocketIc`, the controller principal, all SNS environments,
/// and any extra token ledgers that were added via `add_token_ledger`.
pub struct TestEnv {
    pub pic: Rc<RefCell<pocket_ic::PocketIc>>,
    pub controller: Principal,
    /// Extra ICRC-1 token ledgers keyed by `"{symbol}_ledger_canister_id"`.
    pub tokens: Vec<TokenSymbol>,
    sns_envs: HashMap<String, SnsEnv>,
}

impl TestEnv {
    /// Returns the `SnsEnv` for the given project.
    pub fn get_sns(&self, project: SnsProject) -> &SnsEnv {
        self.sns_envs
            .get(&project.to_string())
            .unwrap_or_else(|| panic!("{} SNS was not added to this TestEnv", project))
    }

    /// Removes and returns the `SnsEnv` for the given project.
    /// Used by suite builders that need to take ownership of the inner env.
    pub fn remove_sns(&mut self, project: SnsProject) -> SnsEnv {
        self.sns_envs
            .remove(&project.to_string())
            .unwrap_or_else(|| panic!("{} SNS was not added to this TestEnv", project))
    }

    pub fn get_ledger_canister_id(&self, token: TokenSymbol) -> Result<Principal, String> {
        if self.tokens.contains(&token) {
            Ok(token.ledger_id(false))
        } else {
            Err("This test env doesn't support the token you're looking for".to_string())
        }
    }

    pub fn install_dex_interaction(
        &self,
        canister_id: Principal,
        args: BuybackBurnArgs,
    ) -> Principal {
        setup_dex_interaction::setup(
            &mut self.pic.borrow_mut(),
            canister_id,
            args,
            self.controller,
        )
    }

    pub fn install_rewards(
        &self,
        canister_id: Principal,
        sns_gov_canister_id: Principal,
    ) -> Principal {
        setup_rewards::setup(
            &self.pic.borrow(),
            canister_id,
            self.get_ledger_canister_id(TokenSymbol::ICP).unwrap(),
            self.get_ledger_canister_id(TokenSymbol::OGY).unwrap(),
            self.get_ledger_canister_id(TokenSymbol::GOLDAO).unwrap(),
            sns_gov_canister_id,
            &self.controller,
        )
    }

    pub fn install_sns_neuron_controller(
        &self,
        canister_id: Principal,
        rewards_destination: Option<Principal>,
        ogy_sns_governance_canister_id: Principal,
        ogy_sns_ledger_canister_id: Principal,
        ogy_sns_rewards_canister_id: Principal,
        goldao_sns_governance_canister_id: Principal,
        goldao_sns_ledger_canister_id: Principal,
        goldao_sns_rewards_canister_id: Principal,
    ) -> Principal {
        setup_sns_neuron_controller::setup(
            &self.pic.borrow(),
            canister_id,
            vec![self.controller],
            rewards_destination,
            ogy_sns_governance_canister_id,
            ogy_sns_ledger_canister_id,
            ogy_sns_rewards_canister_id,
            goldao_sns_governance_canister_id,
            goldao_sns_ledger_canister_id,
            goldao_sns_rewards_canister_id,
        )
    }

    pub fn install_canister_jobs(
        &self,
        canister_id: Principal,
        ogy_ledger_canister_id: Principal,
    ) -> Principal {
        setup_canister_jobs::setup(
            &self.pic.borrow(),
            self.controller,
            canister_id,
            ogy_ledger_canister_id,
        )
    }

    pub fn install_collection_index(&self, canister_id: Principal) -> Principal {
        setup_collection_index::setup(&self.pic.borrow(), self.controller, canister_id)
    }

    pub fn install_ogy_token_swap(
        &self,
        canister_id: Principal,
        ogy_legacy_ledger_canister_id: Principal,
        ogy_new_ledger_canister_id: Principal,
        ogy_legacy_minting_account_principal: Principal,
    ) -> Principal {
        setup_ogy_token_swap::setup(
            &self.pic.borrow(),
            self.controller,
            canister_id,
            ogy_legacy_ledger_canister_id,
            ogy_new_ledger_canister_id,
            ogy_legacy_minting_account_principal,
        )
    }
}

/// Top-level builder that owns `PocketIc` and composes any number of SNS environments
/// together with optional extra ICRC-1 token ledgers.
///
/// # Example
/// ```rust
/// let env = TestEnvBuilder::new()
///     .add_sns(SnsConfig::new(SnsProject::Ogy).with_neurons())
///     .add_sns(SnsConfig::new(SnsProject::GoldDao).with_neurons())
///     .add_token_ledger("ICP", &mut vec![], Nat::from(10_000u64))
///     .build();
///
/// let ogy = env.sns(SnsProject::Ogy);
/// let icp_ledger = env.token_ledgers["icp_ledger_canister_id"];
/// ```
pub struct TestEnvBuilder {
    controller: Principal,
    sns_configs: Vec<SnsConfig>,
    tokens: Vec<TokenSymbol>,
}

impl TestEnvBuilder {
    pub fn new() -> Self {
        Self {
            controller: random_principal(),
            sns_configs: vec![],
            tokens: vec![],
        }
    }

    pub fn with_controller(mut self, controller: Principal) -> Self {
        self.controller = controller;
        self
    }

    pub fn add_sns(mut self, config: SnsConfig) -> Self {
        self.sns_configs.push(config);
        self
    }

    pub fn add_token_ledger(mut self, token: &TokenSymbol) -> Self {
        self.tokens.push(*token);
        self
    }

    /// Bulk-add token ledgers from pre-collected vecs — used by suite builders
    /// that accumulate ledger config before delegating to TestEnvBuilder.
    pub fn add_token_ledger_batch(mut self, tokens: Vec<TokenSymbol>) -> Self {
        for token in tokens {
            self.tokens.push(token);
        }
        self
    }

    pub fn build(self) -> TestEnv {
        let pic_ref = Rc::new(RefCell::new(
            PocketIcBuilder::new()
                .with_nns_subnet()
                .with_sns_subnet()
                .with_application_subnet()
                .build(),
        ));

        pic_ref.borrow().set_time(
            (SystemTime::UNIX_EPOCH + std::time::Duration::from_millis(1718697600000)).into(),
        ); // Tue Jun 18 2024 08:00:00 GMT

        let mut sns_envs = HashMap::new();
        let mut tokens = vec![];

        for config in self.sns_configs {
            let test_env = match config.project {
                SnsProject::Ogy => {
                    let sns = SnsTestEnv::ogy(
                        &pic_ref,
                        self.controller,
                        &config.neurons,
                        config.initial_balances,
                    );
                    tokens.push(TokenSymbol::OGY);
                    sns
                }
                SnsProject::GoldDao => {
                    let sns = SnsTestEnv::goldao(
                        &pic_ref,
                        self.controller,
                        &config.neurons,
                        config.initial_balances,
                    );
                    tokens.push(TokenSymbol::GOLDAO);
                    sns
                }
                SnsProject::Wtn => {
                    let sns = SnsTestEnv::wtn(
                        &pic_ref,
                        self.controller,
                        &config.neurons,
                        config.initial_balances,
                    );
                    tokens.push(TokenSymbol::WTN);
                    sns
                }
            };

            sns_envs.insert(
                config.project.to_string(),
                SnsEnv {
                    test_env,
                    neuron_data: config.neurons,
                },
            );
        }

        {
            let pic = pic_ref.borrow();
            for token in self.tokens {
                if !tokens.contains(&token) {
                    setup_ledger::setup(&pic, self.controller, token, None);
                    tokens.push(token)
                }
            }
            pic.advance_time(Duration::from_secs(100));
            tick_n_blocks(&pic, 50);
        }

        TestEnv {
            pic: pic_ref,
            controller: self.controller,
            tokens: tokens.clone(),
            sns_envs,
        }
    }
}
