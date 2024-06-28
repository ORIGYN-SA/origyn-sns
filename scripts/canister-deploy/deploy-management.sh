#!/usr/bin/env bash

## As argument, preferably pass $1 previously defined by calling the pre-deploy script with the dot notation.

show_help() {
  cat << EOF
management canister deployment script.
Must be run from the repository's root folder, and with a running replica if for local deployment.
'staging' and 'ic' networks can only be selected from a Gitlab CI/CD environment.
The NETWORK argument should preferably be passed from the env variable that was previously defined
by the pre-deploy script (using the dot notation, or inside a macro deploy script).

The canister will always be reinstalled locally, and only upgraded in staging and production (ic).

Usage:
  scripts/deploy-management.sh [options] <NETWORK>

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
  GOVERNANCE_PRINCIPALS=$(dfx canister id sns_governance --network $NETWORK)
  AUTHORIZED_PRINCIPALS="principal \"$(dfx identity get-principal)\""
else
  TESTMODE="false"
  GOVERNANCE_PRINCIPALS=$(dfx canister id sns_governance --network $NETWORK)
  AUTHORIZED_PRINCIPALS="principal \"f32hc-unijf-rec4q-dgwlt-ebht6-ka37e-wkv5x-24b4l-hnffi-zk27x-7ae\""
fi

ARGUMENTS="(record {
  test_mode = $TESTMODE;
  authorized_principals = vec { $AUTHORIZED_PRINCIPALS };
  governance_principals = vec { principal \"$GOVERNANCE_PRINCIPALS\" }
  } )"


. ./scripts/deploy-backend-canister.sh management $NETWORK "$ARGUMENTS" $MODE
