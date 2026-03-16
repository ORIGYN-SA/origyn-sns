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
    REWARDS_DESTINATION=null
    AUTHORIZED_PRINCIPAL="fp72l-g7ndm-xsaub-5st4x-kcegj-jnssi-flbaz-awtx3-vr4wk-77wlf-yae"
    
    # OGY Local
    OGY_SNS_GOVERNANCE_ID="jtpnb-waaaa-aaaal-ajc6q-cai"
    OGY_SNS_LEDGER_ID="j5naj-nqaaa-aaaal-ajc7q-cai"
    OGY_SNS_REWARDS_ID="fpmqz-aaaaa-aaaag-qjvua-cai"
    
    # GOLDAO Local (Using OGY IDs as placeholders for local test)
    GOLDAO_SNS_GOVERNANCE_ID="jtpnb-waaaa-aaaal-ajc6q-cai"
    GOLDAO_SNS_LEDGER_ID="j5naj-nqaaa-aaaal-ajc7q-cai"
    GOLDAO_SNS_REWARDS_ID="fpmqz-aaaaa-aaaag-qjvua-cai"

  elif [[ $NETWORK =~ ^(ic)$ ]]; then
    TESTMODE=false
    REWARDS_DESTINATION=null
    AUTHORIZED_PRINCIPAL="uvrim-vpson-krkki-4gaz2-fluwn-epogy-th3sx-kgvgw-3nra7-zs4n5-jae"
    
    # OGY Mainnet
    OGY_SNS_GOVERNANCE_ID="lnxxh-yaaaa-aaaaq-aadha-cai"
    OGY_SNS_LEDGER_ID="lkwrt-vyaaa-aaaaq-aadhq-cai"
    OGY_SNS_REWARDS_ID="yuijc-oiaaa-aaaap-ahezq-cai"
    
    # GOLDAO Mainnet (Update these with real Goldao IDs)
    GOLDAO_SNS_GOVERNANCE_ID="lnxxh-yaaaa-aaaaq-aadha-cai" 
    GOLDAO_SNS_LEDGER_ID="lkwrt-vyaaa-aaaaq-aadhq-cai"
    GOLDAO_SNS_REWARDS_ID="yuijc-oiaaa-aaaap-ahezq-cai"
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
    authorized_principals = vec { principal \"$AUTHORIZED_PRINCIPAL\" };
    rewards_destination = $REWARDS_DESTINATION;
    ogy_manager_config = record {
        ogy_sns_governance_canister_id = principal \"$OGY_SNS_GOVERNANCE_ID\";
        ogy_sns_ledger_canister_id = principal \"$OGY_SNS_LEDGER_ID\";
        ogy_sns_rewards_canister_id = principal \"$OGY_SNS_REWARDS_ID\";
        ogy_rewards_threshold = ($OGY_REWARDS_THRESHOLD : nat);
    };
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