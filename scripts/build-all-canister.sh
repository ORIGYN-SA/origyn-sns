#!/bin/bash

show_help() {
  cat << EOF
Builds all canisters.
Must be run from the repository's root folder.

Usage:
  scripts/build-canister.sh [options] <CANISTER>

Options:
  -h, --help                Show this message and exit
  -it, --integration-test   Includes integration testing code. Only set this when testing as senstive endpoints can be exposed!
EOF
}


if [[ $# -gt 0 ]]; then
  while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do
    case $1 in
      -h | --help )
        show_help
        exit
        ;;
      -it | --integration-test )
        INTTEST="--integration-test"
        ;;
    esac;
    shift;
  done
fi

# List of canisters to include
canister_list="ogy_token_swap sns_rewards"

for canister in $canister_list; do
  ./scripts/build-canister.sh -w $INTTEST "$canister"
  ./scripts/generate-did.sh "$canister"
  ./scripts/build-canister.sh $INTTEST "$canister"
done

echo "Finished building all canisters."
