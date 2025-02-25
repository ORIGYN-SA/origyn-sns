#!/usr/bin/env bash

## As argument, preferably pass $1 previously defined by calling the pre-deploy script with the dot notation.

show_help() {
  cat << EOF
token_metrics canister deployment script.
Must be run from the repository's root folder, and with a running replica if for local deployment.
'staging' and 'ic' networks can only be selected from a Gitlab CI/CD environment.
The NETWORK argument should preferably be passed from the env variable that was previously defined
by the pre-deploy script (using the dot notation, or inside a macro deploy script).

The canister will always be reinstalled locally, and only upgraded in staging and production (ic).

Usage:
  scripts/deploy-token_metrics.sh [options] <NETWORK>

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
  OGY_LEDGER=$(dfx canister id sns_ledger --network staging)
  SNS_GOVERNANCE=$(dfx canister id sns_governance --network staging)
  SUPER_STATS=$(dfx canister id super_stats_v3 --network staging)
  SNS_REWARDS=$(dfx canister id sns_rewards --network staging)
  ORIGYN_TREASURY_ACCOUNT="$SNS_GOVERNANCE.9a703b745d9182542eb16f2d922c9f45c932f29f74acec6c2b807b543fee2383"
  ORIGYN_FOUNDATION_NNS_ACCOUNT="ud7qh-vnh3c-krx66-e2fqy-saxxx-bdyno-2znkq-n5ivx-xeoc6-eygrq-nqe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_DASHBOARD_ACCOUNT="7xc7u-onriy-z2gvh-scsnt-sf3gz-ywjyk-sx2sx-uzqyk-3ugdz-lm7xe-5qe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT="qlqay-cvxyu-k4xzq-ppa5v-2zabq-wmkpe-auxpy-kwels-lkep4-jy462-jqe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_DISTRIBUTION_ACCOUNT="25v3h-aoa5w-4sjgu-qa34v-qvmq5-q5vbl-lrbeb-arn57-lnslo-uxso7-pae.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_NEURON_MAIN_ACCOUNT="2gytz-5mjny-5qfcl-vjsle-654l2-ixgif-3vfqj-nryxk-uzgfx-5df5u-sqe.0000000000000000000000000000000000000000000000000000000000000000"
else
  TESTMODE="false"
  OGY_LEDGER=$(dfx canister id sns_ledger --network $NETWORK)
  SNS_GOVERNANCE=$(dfx canister id sns_governance --network $NETWORK)
  SUPER_STATS=$(dfx canister id super_stats_v3 --network $NETWORK)
  SNS_REWARDS=$(dfx canister id sns_rewards --network $NETWORK)
  ORIGYN_TREASURY_ACCOUNT="$SNS_GOVERNANCE.9a703b745d9182542eb16f2d922c9f45c932f29f74acec6c2b807b543fee2383"
  ORIGYN_FOUNDATION_NNS_ACCOUNT="ud7qh-vnh3c-krx66-e2fqy-saxxx-bdyno-2znkq-n5ivx-xeoc6-eygrq-nqe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_DASHBOARD_ACCOUNT="7xc7u-onriy-z2gvh-scsnt-sf3gz-ywjyk-sx2sx-uzqyk-3ugdz-lm7xe-5qe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT="qlqay-cvxyu-k4xzq-ppa5v-2zabq-wmkpe-auxpy-kwels-lkep4-jy462-jqe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_DISTRIBUTION_ACCOUNT="25v3h-aoa5w-4sjgu-qa34v-qvmq5-q5vbl-lrbeb-arn57-lnslo-uxso7-pae.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_NEURON_MAIN_ACCOUNT="2gytz-5mjny-5qfcl-vjsle-654l2-ixgif-3vfqj-nryxk-uzgfx-5df5u-sqe.0000000000000000000000000000000000000000000000000000000000000000"
fi

ARGUMENTS="(record {
  test_mode = $TESTMODE;
  ogy_new_ledger_canister_id = principal \"$OGY_LEDGER\";
  sns_governance_canister_id = principal \"$SNS_GOVERNANCE\";
  sns_rewards_canister_id = principal \"$SNS_REWARDS\";
  super_stats_canister_id = principal \"$SUPER_STATS\";
  treasury_account = \"$ORIGYN_TREASURY_ACCOUNT\";
  foundation_accounts = vec {
    \"$ORIGYN_FOUNDATION_NNS_ACCOUNT\";
    \"$ORIGYN_FOUNDATION_DASHBOARD_ACCOUNT\";
    \"$ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT\";
    \"$ORIGYN_FOUNDATION_DISTRIBUTION_ACCOUNT\";
    \"$ORIGYN_NEURON_MAIN_ACCOUNT\"
    }
  } )"


. ./scripts/deploy-backend-canister.sh token_metrics $NETWORK "$ARGUMENTS" $MODE
