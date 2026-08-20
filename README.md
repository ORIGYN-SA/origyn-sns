# Origyn SNS

This is the main repository of the ORIGYN SNS and related components.

Go to the [official ORIGYN website](https://origyn.com) for more information about ORIGYN.


## Integration tests

### Run existing integration tests

1) Simply call the script `./scripts/run-integration-tests.sh`. It will download the pocket-ic client and build all canisters that are included in the integrationt testing.

### Add a new canister to integration testing

1) Prepare all the integration test properly in the `backend/integration_tests/` folder.

2) Add your canister to the list of canisters to build in `/scripts/build-all-canister.sh` in the field `canister_list`

3) Call the script `./scripts/run-integration-tests.sh`

### Troublshoot

* You may need to set the max open files on your current shell before running the script by first running `ulimit -n 10240`


## Reproducible builds

Refer to the documentation in the [build](/build/README.md) folder for the reproducible builds.

## Deprecated canisters

The following canisters were retired in August 2026. Their data is now served by the external GLDT/BITY stats API consumed directly by the frontends, and the on-chain canisters have been decommissioned. The source code was removed from this repository; it remains available in git history at the commits referenced below.

| Canister | Mainnet ID | Staging ID | Last commit with source |
| --- | --- | --- | --- |
| `token_metrics` | `juolv-3yaaa-aaaal-ajc6a-cai` | `euyi3-3yaaa-aaaak-akoba-cai` | `48b244530b1a1c9e26ddc3d60f60c6e062783ddd` |
| `super_stats_v3` | `ckyzl-aqaaa-aaaal-ajdbq-cai` | `4pjfx-eyaaa-aaaap-ahd5a-cai` | `48b244530b1a1c9e26ddc3d60f60c6e062783ddd` |
