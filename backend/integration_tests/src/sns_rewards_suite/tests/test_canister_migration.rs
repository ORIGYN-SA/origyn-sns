use crate::sns_rewards_suite::setup::setup_rewards::upgrade_rewards_canister;
use crate::sns_rewards_suite::setup::setup_rewards_old::setup_old_rewards_canister;
use crate::{sns_rewards_suite::setup::default_test_setup, utils::tick_n_blocks};

#[test]
fn test_migration_happy_path() {
    let test_env = default_test_setup();
    let pic = test_env.pic.borrow();
    let sns_rewards_id = test_env.rewards_canister_id;
    setup_old_rewards_canister(
        &pic,
        sns_rewards_id,
        &test_env.token_ledgers,
        test_env.sns_gov_canister_id,
        &test_env.controller,
    );
    tick_n_blocks(&pic, 100);

    let status = pic.canister_status(sns_rewards_id, Some(test_env.sns_gov_canister_id));
    println!("Canister status before migration: {:?}", status);

    upgrade_rewards_canister(&pic, sns_rewards_id, &test_env.sns_gov_canister_id).unwrap();
    tick_n_blocks(&pic, 20);

    tick_n_blocks(&pic, 20);

    let status = pic.canister_status(sns_rewards_id, Some(test_env.sns_gov_canister_id));
    println!("Canister status after migration: {:?}", status);
}
