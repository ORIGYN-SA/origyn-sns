#!/bin/bash


# List of canisters to include
canister_list="ogy_token_swap sns_rewards"

for canister in $canister_list; do
  ./scripts/build-canister.sh "$canister"
done

echo "Finished building all canisters."
