#!/usr/bin/env bash

## As argument, preferably pass $1 previously defined by calling the pre-deploy script with the dot notation.

show_help() {
  cat << EOF
ogy_token_swap canister deployment script.
Must be run from the repository's root folder, and with a running replica if for local deployment.
'staging' and 'ic' networks can only be selected from a Gitlab CI/CD environment.
The NETWORK argument should preferably be passed from the env variable that was previously defined
by the pre-deploy script (using the dot notation, or inside a macro deploy script).

The canister will always be reinstalled locally, and only upgraded in staging and production (ic).

Usage:
  scripts/deploy-ogy_token_swap.sh [options] <NETWORK>

Options:
  -h, --help        Show this message and exit
EOF
}



if [[ $# -gt 0 ]]; then
  while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do
    case $1 in
      -h | --help )
        show_help
        exit
        ;;
    esac;
    shift;
  done
  if [[ "$1" == '--' ]]; then shift; fi
else
  echo "Error: missing <NETWORK> argument"
  exit 1
fi

NETWORK=$1
MODE="proposal"

if [[ ! $NETWORK =~ ^(local|staging|ic)$ ]]; then
  echo "Error: unknown network for deployment"
  exit 2
fi

if [[ $NETWORK =~ ^(local|staging)$ ]]; then
  TESTMODE="true"
  OGY_LEDGER=$(dfx canister id sns_ledger --network staging)
  SNS_GOVERNANCE=$(dfx canister id sns_governance --network staging)
else
  TESTMODE="false"
  OGY_LEDGER=$(dfx canister id sns_ledger --network $NETWORK)
  SNS_GOVERNANCE=$(dfx canister id sns_governance --network $NETWORK)
fi

ARGUMENTS="(record {
  test_mode = $TESTMODE;
  sns_ledger_canister_id = principal \"$OGY_LEDGER\";
  sns_gov_canister_id = principal \"$SNS_GOVERNANCE\";
  } )"


. ./scripts/deploy-backend-canister.sh sns_rewards $NETWORK "$ARGUMENTS" $MODE
