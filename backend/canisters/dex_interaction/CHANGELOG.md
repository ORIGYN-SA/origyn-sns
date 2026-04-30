# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Versions

### [unreleased]

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