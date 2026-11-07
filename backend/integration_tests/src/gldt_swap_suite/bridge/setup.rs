use crate::client::gldt_swap::{bridge_to_evm, get_bridge_evm_signers, get_bridge_status};
use crate::client::icrc1_icrc2_token::icrc2_approve;
use crate::client::pocket::create_canister_with_id;
use crate::gldt_swap_suite::bridge::outcalls::{serve_outcalls, MockEvm};
use crate::gldt_swap_suite::setup::setup_gldt_ledger::setup_gldt_ledger_with_balances;
use crate::gldt_swap_suite::setup::setup_gldt_swap::setup_gldt_swap_canister;
use crate::utils::random_principal;
use crate::wasms::{EVM_RPC, GLDT_SWAP};
use bity_ic_icrc3::config::{ICRC3Config, ICRC3Properties};
use bity_ic_types::BuildVersion;
use candid::{encode_one, CandidType, Nat, Principal};
use gldt_swap_api_canister::init::InitArgs;
use gldt_swap_api_canister::post_upgrade::UpgradeArgs;
use gldt_swap_common::bridge::{
    BridgeConfig, BridgeToEvmArgs, BridgeUpgrade, ChainConfig, EvmChain, EvmProvider,
    OutboundTransfer,
};
use gldt_swap_common::swap_canister_config::{
    FractionalizationConfig, GeneralFractionalizationConfig, SwapCanisterConfig,
};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::approve::ApproveArgs;
use icrc_ledger_types::icrc3::blocks::SupportedBlockType;
use pocket_ic::{ErrorCode, PocketIc, PocketIcBuilder, RejectResponse};
use std::time::Duration;

pub const GLDT_SWAP_CANISTER_ID: &str = "6f6ua-hqaaa-aaaar-qairq-cai";
pub const GLDT_LEDGER_CANISTER_ID: &str = "6c7su-kiaaa-aaaar-qaira-cai";
pub const EVM_RPC_CANISTER_ID: &str = "7hfb6-caaaa-aaaar-qadga-cai";
/// PocketIC's fiduciary subnet holds the threshold keys `key_1`, `test_key_1` and `dfx_test_key`.
pub const ECDSA_KEY_NAME: &str = "test_key_1";
pub const FAKE_ETHEREUM_TOKEN: &str = "0x00000000000000000000000000000000000E7E01";
pub const FAKE_BASE_TOKEN: &str = "0x00000000000000000000000000000000000BA5E1";
pub const LZ_ENDPOINT: &str = "0x1a44076050125825900e736c501f859c50fE728c";
/// `BridgeEnv::user` starts with 1,000 GLDT.
pub const USER_BALANCE_E8S: u64 = 100_000_000_000;
/// The head block both mocked chains report at their first tick.
pub const FIRST_HEAD: u64 = 1_000;

pub struct BridgeEnv {
    pub pic: PocketIc,
    pub controller: Principal,
    /// Stands in for ORIGYN SNS governance, the only caller of `bridge_sns_action`.
    pub sns_governance: Principal,
    pub gldt_swap_canister_id: Principal,
    pub gldt_ledger_canister_id: Principal,
    pub evm_rpc_canister_id: Principal,
    /// A user holding `USER_BALANCE_E8S` GLDT from the start.
    pub user: Principal,
    /// The mocked Ethereum and Base nodes; `start_all_chains` sets them up.
    pub evm: MockEvm,
}

impl BridgeEnv {
    /// Upgrades gldt_swap with the same wasm and the given bridge argument.
    pub fn upgrade_gldt_swap(&self, bridge: Option<BridgeUpgrade>) -> Result<(), RejectResponse> {
        upgrade_gldt_swap(
            &self.pic,
            self.controller,
            self.gldt_swap_canister_id,
            bridge,
        )
    }

    pub fn tick_n(&self, n: usize) {
        for _ in 0..n {
            self.pic.tick();
        }
    }
}

/// Opens every configured chain, so `bridge_to_evm` is no longer `NotReady`. Each chain's
/// first tick reads head `FIRST_HEAD`, then `bridgeInfo()`: no burn, no supply, and the
/// canister's own signer addresses.
pub fn start_all_chains(env: &mut BridgeEnv) {
    env.evm = start_chains(&env.pic, env.controller, env.gldt_swap_canister_id);
}

/// [start_all_chains] on any PocketIC where gldt_swap runs with [bridge_config] and the EVM RPC
/// canister is installed. Returns the mocked nodes.
pub fn start_chains(pic: &PocketIc, controller: Principal, gldt_swap: Principal) -> MockEvm {
    // the first tick runs once both keys are loaded, and compares the token's signers with them
    let (claims, admin) = wait_for_signers_on(pic, controller, gldt_swap);
    let evm = MockEvm::new(
        FIRST_HEAD,
        &claims,
        &admin,
        &[FAKE_ETHEREUM_TOKEN, FAKE_BASE_TOKEN],
    );
    for _ in 0..5 {
        serve_outcalls(pic, |request| evm.answer(request));
        let status = get_bridge_status(pic, controller, gldt_swap, &());
        if status.chains.iter().all(|c| c.start_block.is_some()) {
            // Base's scrape interval starts when its 90 s offset has passed. After that, every
            // further 180 s runs one scrape tick on each chain.
            pic.advance_time(Duration::from_secs(90));
            serve_outcalls(pic, |request| evm.answer(request));
            return evm;
        }
        // a first tick that failed runs again with the next scrape tick
        pic.advance_time(Duration::from_secs(180));
    }
    let status = get_bridge_status(pic, controller, gldt_swap, &());
    panic!("the chains did not start: {:?}", status.chains);
}

/// Ticks until both signer addresses are loaded, and returns them.
pub fn wait_for_signers(env: &BridgeEnv) -> (String, String) {
    wait_for_signers_on(&env.pic, env.controller, env.gldt_swap_canister_id)
}

pub fn wait_for_signers_on(
    pic: &PocketIc,
    controller: Principal,
    gldt_swap: Principal,
) -> (String, String) {
    for _ in 0..30 {
        pic.tick();
        let signers = get_bridge_evm_signers(pic, controller, gldt_swap, &());
        if let (Some(claims), Some(admin)) = (signers.claims, signers.admin) {
            return (claims, admin);
        }
    }
    panic!("signers were not loaded after 30 ticks");
}

/// Upgrades gldt_swap with the same wasm and the given bridge argument.
pub fn upgrade_gldt_swap(
    pic: &PocketIc,
    controller: Principal,
    gldt_swap: Principal,
    bridge: Option<BridgeUpgrade>,
) -> Result<(), RejectResponse> {
    let args = encode_one(gldt_swap_api_canister::Args::Upgrade(UpgradeArgs {
        version: BuildVersion::min(),
        commit_hash: "bridge".to_string(),
        bridge,
    }))
    .unwrap();
    // The subnet limits how many instructions install_code may spend on one canister in a
    // while, and gldt_swap's install and upgrade are heavy: rounds pay the debt off.
    for _ in 0..INSTALL_CODE_ATTEMPTS {
        match pic.upgrade_canister(gldt_swap, GLDT_SWAP.clone(), args.clone(), Some(controller)) {
            Err(e) if e.error_code == ErrorCode::CanisterInstallCodeRateLimited => {
                for _ in 0..ROUNDS_BETWEEN_ATTEMPTS {
                    pic.tick();
                }
            }
            result => return result,
        }
    }
    panic!("gldt_swap upgrade still rate limited after {INSTALL_CODE_ATTEMPTS} attempts");
}

const INSTALL_CODE_ATTEMPTS: usize = 100;
const ROUNDS_BETWEEN_ATTEMPTS: usize = 10;

/// Installs the EVM RPC canister at its mainnet id, in demo mode.
pub fn install_evm_rpc(pic: &PocketIc, controller: Principal) -> Principal {
    let evm_rpc_canister_id = create_canister_with_id(
        pic,
        controller,
        Principal::from_text(EVM_RPC_CANISTER_ID).unwrap(),
    );
    pic.add_cycles(evm_rpc_canister_id, 100_000_000_000_000);
    pic.install_canister(
        evm_rpc_canister_id,
        EVM_RPC.clone(),
        encode_one(EvmRpcInstallArgs { demo: Some(true) }).unwrap(),
        Some(controller),
    );
    evm_rpc_canister_id
}

/// `owner` approves the burn and bridges `amount` e8s to `chain`, to Anvil's account 1.
/// The chains must be open.
pub fn bridge_out(
    pic: &PocketIc,
    gldt_ledger: Principal,
    gldt_swap: Principal,
    owner: Principal,
    chain: EvmChain,
    amount: u64,
) -> OutboundTransfer {
    let approved = icrc2_approve(
        pic,
        owner,
        gldt_ledger,
        &ApproveArgs {
            from_subaccount: None,
            spender: Account::from(gldt_swap),
            amount: Nat::from(amount),
            expected_allowance: None,
            expires_at: None,
            fee: None,
            memo: None,
            created_at_time: None,
        },
    );
    assert!(
        matches!(approved, icrc2_approve::Response::Ok(_)),
        "{approved:?}"
    );
    bridge_to_evm(
        pic,
        owner,
        gldt_swap,
        &BridgeToEvmArgs {
            chain,
            recipient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".to_string(),
            amount: Nat::from(amount),
            from_subaccount: None,
        },
    )
    .expect("bridge_to_evm")
}

/// The bridge config for chain ids 1 and 8453 with fake token addresses.
pub fn bridge_config(sns_governance: Principal) -> BridgeConfig {
    BridgeConfig {
        sns_governance,
        evm_rpc_canister: Principal::from_text(EVM_RPC_CANISTER_ID).unwrap(),
        ecdsa_key_name: ECDSA_KEY_NAME.to_string(),
        admin_action_validity_secs: 7 * 24 * 60 * 60,
        admin_action_max_validity_secs: 30 * 24 * 60 * 60,
        chains: vec![
            chain_config(EvmChain::Ethereum),
            chain_config(EvmChain::Base),
        ],
    }
}

pub fn chain_config(chain: EvmChain) -> ChainConfig {
    let (chain_id, lz_eid, token, confirmations, head_rpc_url) = match chain {
        EvmChain::Ethereum => (
            1,
            30101,
            FAKE_ETHEREUM_TOKEN,
            3,
            "https://ethereum-rpc.publicnode.com",
        ),
        EvmChain::Base => (
            8453,
            30184,
            FAKE_BASE_TOKEN,
            12,
            "https://base-rpc.publicnode.com",
        ),
    };
    ChainConfig {
        chain,
        chain_id,
        lz_eid,
        token: token.to_string(),
        lz_endpoint: LZ_ENDPOINT.to_string(),
        confirmations,
        head_rpc_url: head_rpc_url.to_string(),
        providers: vec![EvmProvider::Alchemy, EvmProvider::Ankr],
        scrape_interval_secs: 180,
        max_window_blocks: 500,
        log_batch_size: 50,
    }
}

pub fn bridge_upgrade(sns_governance: Principal) -> BridgeUpgrade {
    BridgeUpgrade {
        config: Some(bridge_config(sns_governance)),
        chain_resets: vec![],
    }
}

/// PocketIC with NNS and fiduciary subnets, the GLDT ledger, the EVM RPC canister,
/// and gldt_swap with the bridge config at init.
pub fn setup_bridge_env() -> BridgeEnv {
    BridgeEnvBuilder::new().build()
}

pub struct BridgeEnvBuilder {
    bridge_at_init: bool,
}

impl Default for BridgeEnvBuilder {
    fn default() -> Self {
        Self {
            bridge_at_init: true,
        }
    }
}

/// The EVM RPC canister's install arguments; every field is optional.
#[derive(CandidType)]
struct EvmRpcInstallArgs {
    demo: Option<bool>,
}

impl BridgeEnvBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    /// Installs gldt_swap without a bridge config, as the deployed canister is today.
    pub fn without_bridge_at_init(mut self) -> Self {
        self.bridge_at_init = false;
        self
    }

    pub fn build(self) -> BridgeEnv {
        // canister ids in -aaaar- ranges live on the fiduciary subnet, which also has the threshold keys
        let pic = PocketIcBuilder::new()
            .with_nns_subnet()
            .with_fiduciary_subnet()
            .build();
        let controller = random_principal();
        let sns_governance = random_principal();
        let user = random_principal();
        let gldt_swap_canister_id = Principal::from_text(GLDT_SWAP_CANISTER_ID).unwrap();

        let gldt_ledger_canister_id = setup_gldt_ledger_with_balances(
            &pic,
            controller,
            Principal::from_text(GLDT_LEDGER_CANISTER_ID).unwrap(),
            gldt_swap_canister_id,
            vec![(Account::from(user), Nat::from(USER_BALANCE_E8S))],
        );

        let evm_rpc_canister_id = install_evm_rpc(&pic, controller);

        let mut constants = ICRC3Properties::default();
        constants.max_memory_size_bytes = 60000;
        constants.tx_window = Duration::from_millis(500);
        constants.max_transactions_in_window = 100;
        constants.max_blocks_per_response = 100;
        constants.max_transactions_to_purge = 5;
        constants.initial_cycles = 5_000_000_000_000;
        constants.reserved_cycles = 5_000_000_000_000;

        let block_type = |name: &str| {
            SupportedBlockType {
            block_type: name.to_string(),
            url: "https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-3/README.md#supported-block-types".to_string(),
        }
        };
        let init_args = gldt_swap_api_canister::Args::Init(InitArgs {
            test_mode: true,
            version: BuildVersion::min(),
            commit_hash: "bridge".to_string(),
            // the bridge burns and mints on the one ledger the swap configs name
            swap_configs: vec![SwapCanisterConfig {
                icrc7_canister_id: random_principal(),
                fractionalization_config: FractionalizationConfig::General(
                    GeneralFractionalizationConfig {
                        division: 100_000_000_000_000,
                        swap_fee: Nat::from(100_000_000_u64),
                        ledger_id: gldt_ledger_canister_id,
                    },
                ),
            }],
            authorized_principals: vec![controller],
            buyback_burn_canister: None,
            gldt_swap_old_archive: Principal::from_text("yx6zg-byaaa-aaaak-qucpq-cai").unwrap(),
            icrc3_config: ICRC3Config {
                supported_blocks: vec![block_type("reverse_swap"), block_type("forward_swap")],
                constants,
            },
            bridge: self.bridge_at_init.then(|| bridge_upgrade(sns_governance)),
        });
        let gldt_swap_canister_id =
            setup_gldt_swap_canister(&pic, controller, gldt_swap_canister_id, init_args);

        BridgeEnv {
            pic,
            controller,
            sns_governance,
            gldt_swap_canister_id,
            gldt_ledger_canister_id,
            evm_rpc_canister_id,
            user,
            evm: MockEvm::default(),
        }
    }
}
