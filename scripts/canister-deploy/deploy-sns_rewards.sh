#!/usr/bin/env bash

NETWORK=$1
DEPLOYMENT_VIA="proposal"

. ./scripts/extract_commit_tag_data_and_commit_sha.sh sns_rewards $NETWORK

if [[ $REINSTALL == "reinstall" ]]; then

  SNS_GOVERNANCE_CANISTER_ID=$(dfx canister id sns_governance --network "$NETWORK")
  SNS_LEDGER_CANISTER_ID=$(dfx canister id sns_ledger --network "$NETWORK")

  if [[ $NETWORK =~ ^(local|staging)$ ]]; then
    TESTMODE=true
  elif [[ $NETWORK =~ ^(ic)$ ]]; then
    TESTMODE=false
  else
    echo "Error: unknown network for deployment. Found $NETWORK."
    exit 2
  fi

  ARGUMENTS="(variant { Init = record {
    test_mode = $TESTMODE;
    commit_hash = \"$COMMIT_SHA\";
    version = $BUILD_VERSION;
    sns_ledger_canister_id = principal \"$SNS_LEDGER_CANISTER_ID\";
    sns_gov_canister_id = principal \"$SNS_GOVERNANCE_CANISTER_ID\"
  }})"

else
  ARGUMENTS="(variant { Upgrade = record {
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
  }})"
fi

. ./scripts/deploy-backend-canister.sh sns_rewards $NETWORK "$ARGUMENTS" $DEPLOYMENT_VIA $VERSION $REINSTALL
