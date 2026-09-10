# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Versions

### [unreleased]

### [1.0.12] - 2026-09-10

#### Fixed

- Fixed the consent method name for `claim_reward` so OISY users can claim rewards.

### [1.0.11] - 2026-06-23

#### Fixed

- **Add guard on claim_rewards**: Added rejection on the claim_rewards and claim_rewards_batch calls

### [1.0.10] - 2026-05-18

#### Fixed

- **Payment Rounds history**: Old payment rounds history is now also accessible
- **Canister migration**: Fixed the bug that prevented canister from upgrading

### [1.0.9] - 2026-04-02

#### Added

- **State**: Include versioning and commit info into CanisterInfo.
- **New rewards flow**: Rewards from neurons in external SNS/NNS are swapped to OGY and then distributed for tokens locked for more than 5 years.

#### Updated

- **Dependencies**: All the crates were updated to the newest version.

### [1.0.8] - 2024-11-25

#### Fix
- neuron sync interval - the interval for the neuron sync timer needs to be scheduled every hour

### [1.0.7] - 2024-11-22

#### Fix
- post upgrade intervals - the intervals for consistent timers need to be set in post upgrade

### [1.0.6] - 2024-11-22 

#### Changed

- **Consistent distribution times** - Upgrading the sns_rewards canister can reset the weekly timer of a reward distribution. This is not ideal because if the the next distribution is only 1 day away and the canister is upgraded then the timer resets and another week will have to pass until a reward distribution happens taking the total time for that distribution window to 1 week and 6 days. This new feature ensures a consistent distribution date and time window of every Monday between 14:00 and 16:00 UTC.

### [1.0.5] - 2024-08-20

#### Changed

- let any principal in permission list claim rewards to enable actual owners of neurons to also claim rewards

### [1.0.4] - 2024-06-07

#### Changed

- reactivated the guard for set_daily_ogy_burn_rate

### [1.0.3] - 2024-06-07

#### Changed

- reactivated the guard for set_daily_reserve_transfer
- temporarily disable the guard for set_daily_ogy_burn_rate to set it manually

### [1.0.2] - 2024-06-07

#### Changed

- temporarily disable the guard for set_daily_reserve_transfer to set it manually

### [1.0.1] - 2024-05-10

#### Fixed

- removed test_mode from init call as it's not needed and doesn't initialise the canister correctly

### [1.0.0] - 2024-05-10

#### Description

This marks the initial release of SNS Rewards (sns_rewards canister). SNS Rewards calculates the contribution of each OGY neuron as a percentage of the total over a specified period. Subsequently, it transfers the DAO's treasury rewards based on these percentages.

#### Added

- **Daily OGY Neuron Synchronization** : Keeps track of each OGY neuron's maturity gains on a daily basis.
- **Weekly Reward Distribution** : Calculate and distribute rewards weekly based on the proportional accumulated maturity of each neuron for that week.
- **Daily Reserve Pool Transfer** : Transfers OGY tokens to a dedicated reward pool within the canister daily, ensuring a consistent payout amount each week for the weekly reward distribution of OGY tokens.
- **Neuron Ownership & Reward Claims** : Easily claim ownership of a neuron via hotkeys and subsequently claim any distributed rewards.
- **OGY Daily Burn** : Enables a daily burn of OGY tokens
