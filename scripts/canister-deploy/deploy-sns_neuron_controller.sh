#!/usr/bin/env bash

NETWORK=$1
DEPLOYMENT_VIA="proposal"

# Standard NNS Canister IDs (Same for local/IC)
NNS_GOVERNANCE_ID="rrkah-fqaaa-aaaaa-aaaaq-cai"
NNS_LEDGER_ID="ryjl3-tyaaa-aaaaa-aaaba-cai"
ICP_REWARDS_THRESHOLD="100_000_000" # 1 ICP

# New Thresholds for OGY and GOLDAO
OGY_REWARDS_THRESHOLD="500_000_000_000"     # Example value
GOLDAO_REWARDS_THRESHOLD="100_000_000_000"  # Example value


. ./scripts/extract_commit_tag_data_and_commit_sha.sh sns_neuron_controller $NETWORK

if [[ $REINSTALL == "reinstall" ]]; then

  if [[ $NETWORK =~ ^(local|staging)$ ]]; then
    TESTMODE=true
    BUYBACK_BURN=$(dfx canister id dex_interaction --network "$NETWORK")

    AUTHORIZED_PRINCIPALS=$(dfx identity get-principal)

    GOLDAO_SNS_GOVERNANCE_ID=j3ioe-7iaaa-aaaap-ab23q-cai
    GOLDAO_SNS_LEDGER_ID=irhm6-5yaaa-aaaap-ab24q-cai
    GOLDAO_SNS_REWARDS_ID=rbv23-fqaaa-aaaam-qbfma-cai

    NNS_GOVERNANCE_ID=rrkah-fqaaa-aaaaa-aaaaq-cai
    NNS_LEDGER_ID=ryjl3-tyaaa-aaaaa-aaaba-cai

  elif [[ $NETWORK =~ ^(ic)$ ]]; then
    TESTMODE=false
    BUYBACK_BURN=$(dfx canister id dex_interaction --network "$NETWORK")
    AUTHORIZED_PRINCIPALS=$(dfx canister id sns_governance --network "$NETWORK")

    GOLDAO_SNS_GOVERNANCE_ID=tr3th-kiaaa-aaaaq-aab6q-cai
    GOLDAO_SNS_LEDGER_ID=tyyy3-4aaaa-aaaaq-aab7a-cai
    GOLDAO_SNS_REWARDS_ID=iyehc-lqaaa-aaaap-ab25a-cai

    NNS_GOVERNANCE_ID=rrkah-fqaaa-aaaaa-aaaaq-cai
    NNS_LEDGER_ID=ryjl3-tyaaa-aaaaa-aaaba-cai
  else
    echo "Error: unknown network for deployment. Found $NETWORK."
    exit 2
  fi

  # Construct the complex Candid record for Init
 # Construct the complex Candid record for Init
  ARGUMENTS="(variant { Init = record {
    test_mode = $TESTMODE;
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
    authorized_principals = vec { principal \"$AUTHORIZED_PRINCIPALS\" };
    rewards_destination = opt principal \"$BUYBACK_BURN\";
    goldao_manager_config = record {
        goldao_sns_governance_canister_id = principal \"$GOLDAO_SNS_GOVERNANCE_ID\";
        goldao_sns_ledger_canister_id = principal \"$GOLDAO_SNS_LEDGER_ID\";
        goldao_sns_rewards_canister_id = principal \"$GOLDAO_SNS_REWARDS_ID\";
        goldao_rewards_threshold = ($GOLDAO_REWARDS_THRESHOLD : nat);
    };
    icp_manager_config = record {
        nns_governance_canister_id = principal \"$NNS_GOVERNANCE_ID\";
        nns_ledger_canister_id = principal \"$NNS_LEDGER_ID\";
        icp_rewards_threshold = ($ICP_REWARDS_THRESHOLD : nat);
    };
  }})"

else
  ARGUMENTS="(variant { Upgrade = record {
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
  }})"
fi

. ./scripts/deploy-backend-canister.sh sns_neuron_controller $NETWORK "$ARGUMENTS" $DEPLOYMENT_VIA $VERSION $REINSTALL
