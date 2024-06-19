use std::time::Duration;
use candid::Nat;
use icrc_ledger_types::icrc1::account::Account;
use utils::consts::E8S_PER_OGY;
use crate::client::icrc1::client::{ balance_of, transfer, total_supply };
use crate::canister_jobs_suite::{ init::init, TestEnv };

#[test]
fn daily_burn_job() {
    let env = init();
    let TestEnv { mut pic, canister_ids, controller } = env;

    let ledger_canister_id = canister_ids.ogy_ledger_canister_id;
    let canister_jobs_canister_id = canister_ids.canister_jobs_canister_id;

    let minting_account = controller;

    let daily_jobs_account = Account { owner: canister_jobs_canister_id, subaccount: None };

    // Make the initial mint transaction to daily_jobs_account
    assert_eq!(
        transfer(
            &mut pic,
            minting_account,
            ledger_canister_id,
            None,
            daily_jobs_account,
            (100_000_000 * E8S_PER_OGY).into()
        ),
        Ok((0u8).into())
    );

    assert_eq!(
        balance_of(&pic, ledger_canister_id, daily_jobs_account),
        Nat::from(100_000_000 * E8S_PER_OGY)
    );

    // Check the total supply to be 100_000_000 OGY.
    let ts = total_supply(&pic, ledger_canister_id);
    println!("Total supply: {}", ts);
    assert_eq!(total_supply(&pic, ledger_canister_id), Nat::from(100_000_000 * E8S_PER_OGY));

    // Simulate 5 days of burning job
    for i in 1..5 {
        // Advance one day to allow the burn transaction to take place
        pic.advance_time(Duration::from_secs(86_400));

        // For some reason we need this
        for _ in 1..20 {
            pic.tick();
        }

        // Check the total supply to be 90_000_000 OGY, the job is burning 1_000_000 OGY
        let burnt_so_far = i * 1_000_000;
        let remaining_total_supply = 100_000_000 - burnt_so_far;
        println!("Remaining in day {} is: {}", i, remaining_total_supply);

        // Expect the balance of principal 1 to be less with 1_000_000 (how much was burnt)
        assert_eq!(
            balance_of(&pic, ledger_canister_id, daily_jobs_account),
            Nat::from(remaining_total_supply * E8S_PER_OGY)
        );

        // Also expect the total supply to be less with 1_000_000
        assert_eq!(
            total_supply(&pic, ledger_canister_id),
            Nat::from(remaining_total_supply * E8S_PER_OGY)
        );
    }
}
