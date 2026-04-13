# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.1.0] - 2026-04-13

### Added
- `Args` enum lifecycle (`Init`/`Upgrade` variants) with `authorized_principals`, `version`, `commit_hash`.
- Timer status tracking and `HealthStatus` in `/metrics` for all background jobs.
- Ledger indexer auto-starts on init and restarts on upgrade.

### Removed
- `init_target_ledger` update endpoint (now automatic).
- Stale manual deploy script.

## [2.0.1] - 2026-04-07

### Changed
- Merged latest `develop` branch: picks up updated crate versions, CI/CD streamlining, and `buyback_burn` → `dex_interaction` rename.
- Replaced local `serializer` path dependency with published `bity-ic-serializer` workspace crate.
- Deprecated `super_stats_v3` canister — source retained but removed from Cargo workspace and CI/CD.

## [2.0.0] - 2026-03-23

### Added
- **Merged super_stats_v3 ledger indexer into token_metrics** — the canister now indexes the OGY ledger directly instead of relying on cross-canister calls to a separate super_stats canister.
- New query endpoints ported from super_stats_v3: `get_account_holders`, `get_principal_holders`, `get_account_overview`, `get_principal_overview`, `get_account_history`, `get_principal_history`, `get_top_account_holders`, `get_top_principal_holders`, `get_total_holders`, `get_activity_stats`, `get_daily_stats`, `get_hourly_stats`, `get_working_stats`.
- New update endpoints: `init_target_ledger`, `start_processing_timer`, `stop_all_timers`.
- CBOR serialization infrastructure (`impl_storable_minicbor!`) for stable memory storage.
- Type aliases (`BasisPoints`, `StakeE8s`, `VotingPower`) and named constants for readability.
- Shared pagination and aggregation helpers to deduplicate query logic.

### Changed
- `GovernanceStats` fields changed from `Nat` to `u128` (enables stable memory storage).
- `WalletOverview.total` changed from `u64` to `u128` (fixes silent truncation for large balances).
- Moved `wallets_list`, `merged_wallets_list`, `gov_stake_history`, and `voting_power_ratio_history` from heap to stable memory — reduces serialized heap from ~100MB to ~15MB.
- Flattened `ledger_indexer/` into `indexing/` module; merged ledger indexer state and utils into top-level modules.
- Moved `init_target_ledger`, `start_processing_timer`, `stop_all_timers` from queries to updates.
- Removed `super_stats_canister_id` from `InitArgs` — no longer needed.
- Removed legacy migration code and unused `balance_list` field.

### Fixed
- `get_stake_history` panics when requested days exceeds available history.
- `get_voting_participation_history` panics when requested days exceeds available history.
- `get_voting_power_ratio_history` panics when requested days exceeds available history.
- `balance_difference()` panics on mismatched vec lengths — now uses `zip()` + `saturating_sub`.
- Locked neurons with <1 year dissolve delay silently dropped from owner counts.
- Approve `tx_value` defaults to `u128::MAX`, saturating all stats — now properly handled.
- Download manager underflows when tip < start block.
- Transactions at exactly `activity_end_time` fall through both time checks.
- SNS rewards queries same subaccount twice, always returning 0 for the second.
- `check_locked_neurons_period` u64 underflow — dissolved neurons were incorrectly classified as 5-year locked due to wrapping subtraction.
- Fixed `porposals_metrics` typo → `proposals_metrics`.
- Removed `println!` from production code.

### Security
- Added authorization guards to `init_target_ledger`, `start_processing_timer`, and `stop_all_timers` update endpoints.

## [1.0.12] - 2025-03-12

- Increase all jobs timers.

## [1.0.11] - 2025-03-04

- Increase interval for the update balance list to run the job every 12h instead of 2h.

## [1.0.10] - 2025-02-17

- Adds ORIGYN's operational account to foundation assets.

## [1.0.9] - 2024-12-05

- Update the `sync_voting_stats_job` to show the correct values for ORIGYN's stake power.

## [1.0.8] - 2024-09-18

- Increase the `update_balance_list` timer to 2 hours (was 15 minutes).

## [1.0.7] - 2024-07-25

- Add the `get_active_users_count` endpoint, returning the number of accounts and principals with > 0 tokens in their wallet or staked.

## [1.0.6] - 2024-07-15

- Expose endpoints for total supply and circulating supply.

## [1.0.5] - 2024-06-05

- Circulating supply will now deduct the ledger balances of the foundation accounts.

## [1.0.4] - 2024-06-05

- Fixed an issue that was calculating the proposals metrics wrong.

## [1.0.3] - 2024-06-05

- Added the `get_proposals_metrics` query to return the metrics about proposals and voting, such as: total_voting_power, average_voting_power, average_voting_participation etc.
- Fixed an issue that was not updating the `state.wallets_list` when the wallet only had tokens in governance. This was also impacting the response for `get_foundation_assets`.
- Fixed a minor issue that was not allocating the locked tokens to the correct period.

## [1.0.2] - 2024-06-03

- Added the `get_foundation_assets` query to return the total number of tokens in hand of the foundation.
- Added the `get_locked_neurons_period` query to return the total number of tokens staked for 1 - 5 years.

## [unreleased]

- Added `sync_governance` to computed metrics such as total_staked, total_ rewards based on the data from neurons.
- Added `sync_supply_data` job to compute the `total_supply` and `circulating_supply`. 
- Added the `update_balance_list` job to compute the list of all token holders, returning their ledger + governance balances.



