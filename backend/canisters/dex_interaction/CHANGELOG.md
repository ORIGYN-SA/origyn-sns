# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Versions

### [unreleased]

### [1.2.2] - 2026-11-19

#### Fixed

- **Production build**: 1.2.1 (proposal 189) installed the integration-test build of the wasm instead of the production build: the deploy job took the integration-test build's file. This version installs the production build of the same code. That build had no test-only code, so the canister behaves the same.

### [1.2.1] - 2026-09-07

#### Fixed
- **Metrics** : Archive failed swaps

### [1.2.0] - 2026-08-25

#### Fixed
- **Token fees** : Add a token fee fallback for the case the fee was changed

### [1.1.1] - 2026-07-28

#### Fixed
- **Exchange jobs** : Add exchange job fix that allows timer to run immediately

### [1.1.0] - 2026-05-04

#### Added
- **Exchange jobs** : Added ICP -> OGY and WTN -> ICP exchange jobs

### [1.0.1] - 2026-04-13

#### Changed
- **Exchange jobs** : Adjusted the frequency of GOLDAO -> OGY swaps

### [1.0.0] - 2026-03-23

#### Description
This release introduces the canister as a complete system for automated token operations, supporting both deflationary mechanics (burning) and token swap flows. The architecture is designed for extensibility, enabling multiple concurrent jobs with independent configurations and behaviors. All the swaps are executed via decentralized exchanges, and the resulting tokens are routed according to configuration.

#### Added
- **DEX Integration** : Support for ICPSwap to facilitate ICP token swaps. The design is scalable, so that other DEXs could be added in future
- **Token Burning** : Mechanism to send swapped tokens to a minting address for burning. For now this option is disabled
- **Error Handling** : Basic error handling during swap and burn processes to ensure reliable operations