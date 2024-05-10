# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Versions

### [unreleased]

### [1.0.0] - 2024-05-10

#### Description
This marks the initial release of SNS Rewards (sns_rewards canister). SNS Rewards calculates the contribution of each OGY neuron as a percentage of the total over a specified period. Subsequently, it transfers the DAO's treasury rewards based on these percentages.

#### Added
- **Daily OGY Neuron Synchronization** : Keeps track of each OGY neuron's maturity gains on a daily basis.
- **Weekly Reward Distribution** : Calculate and distribute rewards weekly based on the proportional accumulated maturity of each neuron for that week.
- **Daily Reserve Pool Transfer** : Transfers OGY tokens to a dedicated reward pool within the canister daily, ensuring a consistent payout amount each week for the weekly reward distribution of OGY tokens.
- **Neuron Ownership & Reward Claims** : Easily claim ownership of a neuron via hotkeys and subsequently claim any distributed rewards.
- **OGY Daily Burn** : Enables a daily burn of OGY tokens 