#!/usr/bin/env bash

NETWORK=$1
DEPLOYMENT_VIA="direct"

. ./scripts/extract_commit_tag_data_and_commit_sha.sh token_metrics $NETWORK

if [[ $REINSTALL == "reinstall" ]]; then

  if [[ $NETWORK =~ ^(local|staging)$ ]]; then
    TESTMODE="true"
    OGY_LEDGER=$(dfx canister id sns_ledger --network staging)
    SNS_GOVERNANCE=$(dfx canister id sns_governance --network staging)
    SNS_REWARDS=$(dfx canister id sns_rewards --network staging)
  elif [[ $NETWORK =~ ^(ic)$ ]]; then
    TESTMODE="false"
    OGY_LEDGER=$(dfx canister id sns_ledger --network "$NETWORK")
    SNS_GOVERNANCE=$(dfx canister id sns_governance --network "$NETWORK")
    SNS_REWARDS=$(dfx canister id sns_rewards --network "$NETWORK")
  else
    echo "Error: unknown network for deployment. Found $NETWORK."
    exit 2
  fi

  ORIGYN_TREASURY_ACCOUNT="$SNS_GOVERNANCE.9a703b745d9182542eb16f2d922c9f45c932f29f74acec6c2b807b543fee2383"
  ORIGYN_FOUNDATION_NNS_ACCOUNT="ud7qh-vnh3c-krx66-e2fqy-saxxx-bdyno-2znkq-n5ivx-xeoc6-eygrq-nqe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_DASHBOARD_ACCOUNT="7xc7u-onriy-z2gvh-scsnt-sf3gz-ywjyk-sx2sx-uzqyk-3ugdz-lm7xe-5qe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT="qlqay-cvxyu-k4xzq-ppa5v-2zabq-wmkpe-auxpy-kwels-lkep4-jy462-jqe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT_2="25v3h-aoa5w-4sjgu-qa34v-qvmq5-q5vbl-lrbeb-arn57-lnslo-uxso7-pae.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_NEURON_MAIN_ACCOUNT="2gytz-5mjny-5qfcl-vjsle-654l2-ixgif-3vfqj-nryxk-uzgfx-5df5u-sqe.0000000000000000000000000000000000000000000000000000000000000000"

  ARGUMENTS="(variant { Init = record {
    test_mode = $TESTMODE;
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
    ogy_new_ledger_canister_id = principal \"$OGY_LEDGER\";
    sns_governance_canister_id = principal \"$SNS_GOVERNANCE\";
    sns_rewards_canister_id = principal \"$SNS_REWARDS\";
    treasury_account = \"$ORIGYN_TREASURY_ACCOUNT\";
    foundation_accounts = vec {
      \"$ORIGYN_FOUNDATION_NNS_ACCOUNT\";
      \"$ORIGYN_FOUNDATION_DASHBOARD_ACCOUNT\";
      \"$ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT\";
      \"$ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT_2\";
      \"$ORIGYN_NEURON_MAIN_ACCOUNT\"
    };
    authorized_principals = vec {
      principal \"$SNS_GOVERNANCE\"
    }
  }})"

else
  ARGUMENTS="(variant { Upgrade = record {
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
  }})"
fi

. ./scripts/deploy-backend-canister.sh token_metrics $NETWORK "$ARGUMENTS" $DEPLOYMENT_VIA $VERSION $REINSTALL
