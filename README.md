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
