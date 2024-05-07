#!/usr/bin/env bash

./scripts/build-canister.sh token_metrics &&
./scripts/generate-did.sh token_metrics &&
./scripts/build-canister.sh token_metrics &&

dfx deploy --network staging token_metrics --argument "(record {
  test_mode = true;
  ogy_legacy_ledger_canister_id = principal \"tyyy3-4aaaa-aaaaq-aab7a-cai\";
  ogy_new_ledger_canister_id = principal \"tyyy3-4aaaa-aaaaq-aab7a-cai\";
  ogy_legacy_minting_account_principal = principal \"tyyy3-4aaaa-aaaaq-aab7a-cai\";
  } )" --mode reinstall
# dfx deploy --network staging token_metrics --argument '(null)'
