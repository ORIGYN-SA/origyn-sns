# Origyn SNS

This is the main repository of the ORIGYN SNS and related components.

Go to the [official ORIGYN website](https://origyn.com) for more information about ORIGYN.


## Integration tests

1) You will need to download the pocket-ic client and place it at backend/integration_tests/pocket-ic

2) Build canisters correctly.
you will need to build the following canisters with the inttest features flag e.g cargo build --features inttest .......
- ogy_token_swap
- sns_rewards

3) you may need to set the max open files on your current shell before running `cargo test` by first running `ulimit -n 10240`

4) Run the tests e.g cargo test