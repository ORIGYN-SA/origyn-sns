# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ORIGYN SNS is a Rust/TypeScript monorepo for Internet Computer (IC) blockchain canisters. It provides DeFi infrastructure including token swapping, rewards distribution, statistics aggregation, and NFT collection indexing.

## Build Commands

### Backend Canisters (Rust → WebAssembly)

```bash
# Build single canister (optimized + gzipped)
scripts/build-canister.sh <CANISTER_NAME>

# Build for integration testing (includes test code)
scripts/build-canister.sh -it <CANISTER_NAME>

# Build all canisters
scripts/build-all-canister.sh

# Verify reproducible build checksum
scripts/build-canister.sh --verify <CANISTER_NAME>
```

Canister names: `ogy_token_swap`, `sns_rewards`, `super_stats_v3`, `token_metrics`, `canister_jobs`, `collection_index`

### Frontend (React/Vite)

```bash
npm run dev --workspace ogy_dashboard          # Development server
npm run build:staging --workspace ogy_dashboard # Build for staging
npm run lint --workspace ogy_dashboard          # ESLint
```

## Testing

### Unit Tests

```bash
cargo test -p <CANISTER_NAME>           # Test single canister
cargo test -p ogy_token_swap            # Example
```

### Integration Tests (PocketIC)

```bash
./scripts/run-integration-tests.sh      # Build + run all integration tests
./scripts/run-integration-tests.sh -n   # Run tests only (skip rebuild)
```

Integration tests are in `backend/integration_tests/src/<canister>_suite/tests/`.

### Linting

```bash
cargo clippy                            # Rust linting
cargo fmt                               # Rust formatting
```

## Architecture

### Backend Canister Structure

Each canister follows an API/Impl separation pattern:

```
backend/canisters/<CANISTER>/
├── api/                    # Public interface
│   ├── can.did            # Candid interface definition
│   └── src/
│       ├── types.rs       # Public data types
│       ├── queries.rs     # Read-only methods
│       ├── updates.rs     # Mutable methods
│       └── lifecycle.rs   # Init, pre_upgrade, post_upgrade
└── impl/                   # Implementation
    └── src/
        ├── lib.rs         # Entry point with export_candid!()
        ├── state.rs       # Stable state management
        ├── guards.rs      # Access control
        └── memory.rs      # Memory layout
```

### Shared Libraries (`backend/libraries/`)

- **canister_client** / **canister_client_macros** - C2C (canister-to-canister) communication
- **canister_state_macros** - State management macros
- **stable_memory** - IC stable memory utilities
- **types** - Shared type definitions
- **ledger_utils** - Ledger interaction helpers

### External Canisters (`backend/external_canisters/`)

Wrappers for IC ledgers and SNS governance with:
- `api/` - Candid interface + types
- `c2c_client/` - Canister-to-canister client

### Frontend Apps

- `frontend/ogy_dashboard` - Main OGY dashboard (React 18, Vite, TailwindCSS)
- `frontend/origyn_landing_page` - Landing page (React 19)

Both use Dfinity Agent for IC blockchain interaction.

## Deployment

```bash
# Deploy to staging (direct)
scripts/deploy-backend-canister.sh <CANISTER> staging "" direct

# Deploy to production via SNS proposal
scripts/deploy-backend-canister.sh <CANISTER> ic "" proposal
```

## Key Configuration Files

- `dfx.json` - Dfinity CLI configuration (networks, canisters)
- `canister_ids.json` - Canister IDs per network
- `sns/sns_init.yaml` - SNS initialization config
- `Cargo.toml` - Rust workspace with 40+ crates

## Networks

- `local` - Ephemeral local development (localhost:8080)
- `staging` - Persistent staging on IC
- `preprod` - Pre-production on IC
- `ic` - Production mainnet
