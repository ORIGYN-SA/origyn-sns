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