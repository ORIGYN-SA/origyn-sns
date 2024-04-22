#!/usr/bin/env bash

./scripts/build-canister.sh ogy_token_swap &&
./scripts/generate-did.sh ogy_token_swap &&
./scripts/build-canister.sh ogy_token_swap &&

# dfx deploy --network staging ogy_token_swap --argument '(opt record {test_mode = true} )' --mode reinstall
# dfx deploy --network staging ogy_token_swap --argument '(null)'
