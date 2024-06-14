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
