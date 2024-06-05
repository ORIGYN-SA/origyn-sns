# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.1] - 2024-06-03

- Now computes the `max_balance` for each account/principal based on transaction blocks. This will be returned by `get_principal_overview` and `get_account_overview`.

## [1.0.2] - 2024-06-05

- The `super_stats_v3` canister now exports the candid and can be auto-generated, similar other backend canisters.