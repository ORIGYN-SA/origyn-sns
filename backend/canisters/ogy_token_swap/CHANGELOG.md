# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Versions

### unreleased

#### Updated

- **Whitelist**: Reinstate the whitelist for swaps. `swap_tokens` is again restricted to whitelisted or authorised principals, and `is_caller_whitelisted` reports the caller's actual whitelist status.

### [1.0.7] - 2026-07-20

#### Added

- **Swap statistics**: Include info about stuck swaps in swapping statistics.

#### Updated

- **Whitelist**: Remove whitelist for swaps.

### [1.0.6] - 2026-03-23

#### Added

- **State**: Include versioning and commit info into CanisterInfo.

#### Updated

- **Dependencies**: All the crates were updated to the newest version.

### [1.0.5] - 2025-10-30

#### Added

- Added whitelist for token swaps

### [1.0.4] - 2025-08-07

#### Modified

- Deactivate swap

### [1.0.3] - 2024-07-16

#### Added

- added endpoint to fetch swap statistics

### [1.0.2] - 2024-06-05

#### Changed

- deactivate whitelist

### [1.0.1] - 2024-06-04

#### Added

- added some whitelisted principals

### [1.0.0] - 2024-05-10

- first version of ogy_token_swap
- let's users swap their legacy ogy token to new ogy tokens
