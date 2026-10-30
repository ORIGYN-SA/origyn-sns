# GLDT Swap

## Description

This document serves the purpose of informing developers and technical reviewers key details of the GLDT Swap. 


## Introduction & terminology
GLDT Swap (GS) serves the main purpose of swapping GLD NFT's to and from the fungible token GLDT. When swapping a ratio of 
1g NFT : 100 GLDT determines how much of each type can be swapped so for example a 10g NFT would be valid to receieve 1000 GLDT.

- When swapping NFT -> GLDT we refer to this as a 'Forward' swap
- When swapping GLDT -> NFT we refer to this as as 'Reverse' swap


## Preliminary technical information

#### NFTs
the GLD NFT's are separated into different origny_nft canisters based on their weight. this means all the 1g NFT's are held in one canister, all the 10g NFT's are held in a different canister and so on. All the nft canisters have the same 
interface it's just the meta details of the NFT, i.e, it's weight that change. You can reference [documentation](https://github.com/ORIGYN-SA/nft) called on the nft canister here.

## Folder structure - core code
- `backend/canisters/gldt_swap`
  - `/common` - this holds types used across all other folders
  - `/api` - holds the API interface types for the main swap canister
  - `/impl` - holds the business logic / core code for the main swap canister
- `backend/external_canisters/gldt_swap_archive` - API types and C2C client of the old swap archive canister (`gldt_swap_old_archive`)
- `backend/libraries/cbor` - CBOR helpers used by the common types

## Folder structure - integration tests
- `backend/integration_tests/src/gldt_swap_suite` - holds the suite of tests dedicated to the gldt swap backend canister
- `backend/integration_tests/src/origyn_nft_test_env` - the GLD NFT test environment the suite installs from `backend/integration_tests/wasms/origyn_nft_canister.wasm.gz`

## Handover from Gold DAO

GLDT Swap was handed over from Gold DAO to ORIGYN DAO (Gold DAO SNS proposal 403) and moved here from the
gold-dao repository as is. The crates are members of the root Cargo workspace and use its shared dependency
versions, with one exception: `bity-ic-icrc3` is pinned to 0.5.x in `api/Cargo.toml` and `impl/Cargo.toml`,
the version the deployed canister (build 2.0.1) serialized its ICRC-3 state with.

Do not switch it to the workspace version of `bity-ic-icrc3` (0.7) without a stable state migration: 0.7 changes
the serialized `Blockchain` layout restored in `post_upgrade`, and allocates its own `MemoryManager` on stable
memory, which would conflict with the memory manager in `impl/src/memory.rs`.

```bash
scripts/build-canister.sh gldt_swap        # optimized and gzipped build
cargo test -p gldt_swap                    # unit tests
scripts/build-canister.sh -it gldt_swap    # build with the integration test hooks
```

## Running integration tests locally

1 - Build all canisters for testing, download the PocketIC server into `backend/integration_tests/` and run the
whole suite in one go. On macOS you may need to raise the open file limits first.
```bash
   ulimit -n 202400
   ulimit -f 2024000
   ./scripts/run-integration-tests.sh
```

2 - To rerun only the swap suite without rebuilding:
```bash
cargo test -p integration_tests gldt_swap_suite -- --nocapture
```

## Deployment

CI deploys through `scripts/canister-deploy/deploy-gldt_swap.sh <network>`: to staging when a merge lands on
`develop` (or manually from a merge request pipeline), and to mainnet by SNS proposal on a `gldt_swap-vX.Y.Z` tag.
Upgrades pass only the version and commit hash; the init arguments in that script are used when the CI variable
`REINSTALL_STAGING` is set to `gldt_swap` or `all`, which reinstalls on staging only.


## Architecture & Features

#### Main swap canister

This canister represents the main canister that a frontend will call in order to actually swap GLD NFT's with GLDT and vise versa. Jump to the sections to see how to perform core functionality as a frontend 
- [Swap GLD NFT -> GLDT](#swap-gld-nft---gldt)
- [Swap GLDT -> GLD NFT](#swap-gldt---gld-nft)

#### fee distribution

This feature is yet to be developed but reverse swaps pay an extra 1GLDT to reverse swap and after transfer fees we send the remaining balance of this fee to a dedicated sub account. Eventually it will distribute the rewards but for now we're simply going to collect the fees in the dedicated sub account.


#### Service status

There is another cron that checks periodically if a swap will be successful based on a different factors. for example, if the OGY balance is too low then we set the service to Down so that we may prevent swaps from failing and so that the frontend can display that the service is not currently up to accept new swaps.


#### Stale swaps

Only if a swap's status is wrapped in `Failed` enum varient will it end up in history. There are some places where a swap fails but we purposefully chose to not wrap in Failed. One such case is during the forward swap when a bid attempted. When a bid fails we set the status to `BidFailed`. This status is then picked up by the cron job manage_stale_swaps where it checks for the sale has expired and attempts to refund both parties.