use candid::{ Nat, Principal };

use crate::setup::{ SnsWithRewardsTestEnv, SnsWithRewardsTestEnvBuilder };

pub fn default_test_setup() -> SnsWithRewardsTestEnv {
    let users = vec![
        Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1]),
        Principal::from_slice(&[0, 0, 0, 1, 0, 2, 0, 2, 0, 2])
    ];

    SnsWithRewardsTestEnvBuilder::new()
        .add_random_neurons(10)
        .add_token_ledger("OGY", &mut vec![], Nat::from(200_000u64))
        .with_reward_pools(Nat::from(100_000_000_000u64))
        .add_users(users)
        .build()
}

pub fn test_setup_with_no_neuron_hotkeys() -> SnsWithRewardsTestEnv {
    SnsWithRewardsTestEnvBuilder::new()
        .add_random_neurons(10)
        .add_token_ledger("OGY", &mut vec![], Nat::from(200_000u64))
        .with_reward_pools(Nat::from(100_000_000_000u64))
        .add_users(vec![])
        .build()
}

// minting account is always setup with 1_000_000_000_000_000 and this test env keeps it consistent by not minting to any reward pools as we do in other setups
pub fn test_setup_with_no_reward_pool_mint() -> SnsWithRewardsTestEnv {
    let users = vec![
        Principal::from_slice(&[0, 0, 0, 1, 0, 1, 0, 1, 0, 1]),
        Principal::from_slice(&[0, 0, 0, 1, 0, 2, 0, 2, 0, 2])
    ];

    SnsWithRewardsTestEnvBuilder::new()
        .add_random_neurons(10)
        .add_token_ledger("OGY", &mut vec![], Nat::from(200_000u64))
        .add_users(users)
        .build()
}
