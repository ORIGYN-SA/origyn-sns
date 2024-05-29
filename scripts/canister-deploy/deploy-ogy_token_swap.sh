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
MODE="direct"

if [[ ! $NETWORK =~ ^(local|staging|ic)$ ]]; then
  echo "Error: unknown network for deployment"
  exit 2
fi

if [[ $NETWORK =~ ^(local|staging)$ ]]; then
  TESTMODE="true"
  OGY_LEGACY_MINTING_ACCOUNT_PRINCIPAL="$(dfx identity get-principal)"
  AUTHORIZED_PRINCIPALS="principal \"$(dfx identity get-principal)\""
  OGY_LEGACY_LEDGER=$(dfx canister id ogy_legacy_ledger --network staging)
  OGY_NEW_LEDGER=$(dfx canister id sns_ledger --network staging)
else
  TESTMODE="false"
  OGY_LEGACY_MINTING_ACCOUNT_PRINCIPAL="aomfs-vaaaa-aaaaj-aadoa-cai"
  AUTHORIZED_PRINCIPALS="principal \"f32hc-unijf-rec4q-dgwlt-ebht6-ka37e-wkv5x-24b4l-hnffi-zk27x-7ae\""
  OGY_LEGACY_LEDGER=$(dfx canister id ogy_legacy_ledger --network $NETWORK)
  OGY_NEW_LEDGER=$(dfx canister id sns_ledger --network $NETWORK)
fi

ARGUMENTS="(record {
  test_mode = $TESTMODE;
  ogy_legacy_ledger_canister_id = principal \"$OGY_LEGACY_LEDGER\";
  ogy_new_ledger_canister_id = principal \"$OGY_NEW_LEDGER\";
  ogy_legacy_minting_account_principal = principal \"$OGY_LEGACY_MINTING_ACCOUNT_PRINCIPAL\";
  authorized_principals = vec {$AUTHORIZED_PRINCIPALS}
  } )"


. ./scripts/deploy-backend-canister.sh ogy_token_swap $NETWORK "$ARGUMENTS" $MODE
