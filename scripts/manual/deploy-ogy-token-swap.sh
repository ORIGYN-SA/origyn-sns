#!/usr/bin/env bash

./scripts/build-canister.sh ogy_token_swap &&
./scripts/generate-did.sh ogy_token_swap &&
./scripts/build-canister.sh ogy_token_swap &&

dfx deploy --network staging ogy_token_swap --argument "(record {
  test_mode = true;
  ogy_legacy_ledger_canister_id = principal \"$(dfx canister id ogy_legacy_ledger --network staging)\";
  ogy_new_ledger_canister_id = principal \"$(dfx canister id ogy_ledger --network staging)\";
  ogy_legacy_minting_account_principal = principal \"$(dfx identity get-principal)\";
  } )" --mode reinstall
# dfx deploy --network staging ogy_token_swap --argument '(null)'
