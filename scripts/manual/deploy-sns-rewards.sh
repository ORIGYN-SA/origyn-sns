#!/usr/bin/env bash

./scripts/build-canister.sh sns_rewards &&
./scripts/generate-did.sh sns_rewards &&
./scripts/build-canister.sh sns_rewards &&
dfx deploy --network staging sns_rewards --argument "(record {
  test_mode = true;
  sns_ledger_canister_id = principal \"j5naj-nqaaa-aaaal-ajc7q-cai\";
  sns_gov_canister_id = principal \"lnxxh-yaaaa-aaaaq-aadha-cai\"
  })" --mode reinstall
