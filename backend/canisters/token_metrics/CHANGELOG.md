# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [unreleased]

- Added `sync_governance` to computed metrics such as total_staked, total_ rewards based on the data from neurons.
- Added `sync_supply_data` job to compute the `total_supply` and `circulating_supply`. 
- Added the `update_balance_list` job to compute the list of all token holders, returning their ledger + governance balances.

## [1.0.2] - 2024-06-03

- Added the `get_foundation_assets` query to return the total number of tokens in hand of the foundation.
- Added the `get_locked_neurons_period` query to return the total number of tokens staked for 1 - 5 years.

## [1.0.3] - 2024-06-05

- Added the `get_proposals_metrics` query to return the metrics about proposals and voting, such as: total_voting_power, average_voting_power, average_voting_participation etc.
- Fixed an issue that was not updating the `state.wallets_list` when the wallet only had tokens in governance. This was also impacting the response for `get_foundation_assets`.
- Fixed a minor issue that was not allocating the locked tokens to the correct period.
