# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Versions

### [unreleased]

### [1.0.3] - 2026-08-26

#### Added

- **Dynamic collection indexing**: Added a method to fetch all collections directly from the minting studio and calculate total value locked (TVL) based on per-item pricing.
- **Dynamic gold NFT TVL calculation**: Added a job to index gold canisters and calculate TVL in USD using the price oracle.
- **Dynamic staked OGY calculation**: Added a job to dynamically calculate the value of staked OGY tokens.
- **Min TVL possible fallback**: Added a check on total TVL. If the calculated value is lower than the minimum logical TVL (based on immutable collections), a warning is emitted and the TVL is set to the minimum logical value.

### [1.0.2] - 2026-03-23

#### Added

- **State**: Include versioning and commit info into CanisterInfo.

#### Updated

- **Dependencies**: All the crates were updated to the newest version.

### [1.0.1] - 2025-02-10

- Fixes a minor issue that was displaying the wrong number for total collections count.

### [1.0.0] - 2025-02-10

- Initial release version of the collection index canister.
