#!/usr/bin/env bash

NETWORK=$1
DEPLOYMENT_VIA="proposal"

. ./scripts/extract_commit_tag_data_and_commit_sha.sh buyback_burn $NETWORK

if [[ $REINSTALL == "reinstall" ]]; then

  if [[ $NETWORK =~ ^(local|staging)$ ]]; then
    TESTMODE=true
    AUTHORIZED_PRINCIPALS="principal \"$(dfx identity get-principal)\""
    # 4 hours
    BUYBACK_INTERVAL_IN_SECS=$((4 * 3600))

  elif [[ $NETWORK =~ ^(ic)$ ]]; then
    TESTMODE=false
    AUTHORIZED_PRINCIPAL=$(dfx canister id --network $NETWORK sns_governance)
    # 4 hours
    BUYBACK_INTERVAL_IN_SECS=$((4 * 3600))

  else
    echo "Error: unknown network for deployment. Found $NETWORK."
    exit 2
  fi

  MIN_SWAP_AMOUNT=10_000_000
  ICPSWAP_POOL_ID_WTN_ICP="oqn67-kaaaa-aaaag-qj72q-cai"

  EXCHANGE_CONFIG_WTN_ICP="variant {
    ICPSwap = record {
      swap_canister_id = principal \"$ICPSWAP_POOL_ID_WTN_ICP\";
      zero_for_one = true;
    }
  }"
  
  EXCHANGE_JOB_CONFIG_WTN_ICP="record {
    token_to_sell = variant { WTN };
    token_to_buy = variant { ICP };
    exchange = $EXCHANGE_CONFIG_WTN_ICP;
    rate_per_interval = 2_380_950 : nat64; # FIXME: verify the rate is correct
    job_interval_ms = 14400 : nat64;
    source_subaccount = null;
    min_amount = record { e8s = $MIN_SWAP_AMOUNT : nat64 };
    max_amount = null;
    destination_account = null;
  }"


  ICPSWAP_POOL_ID_GOLDAO_OGY="tblob-hiaaa-aaaag-qj2cq-cai"

  EXCHANGE_CONFIG_GOLDAO_OGY="variant {
    ICPSwap = record {
      swap_canister_id = principal \"$ICPSWAP_POOL_ID_GOLDAO_OGY\";
      zero_for_one = false;
    }
  }"
  
  EXCHANGE_JOB_CONFIG_GOLDAO_OGY="record {
    token_to_sell = variant { GOLDAO };
    token_to_buy = variant { OGY };
    exchange = $EXCHANGE_CONFIG_GOLDAO_OGY;
    rate_per_interval = 2_380_950 : nat64; # FIXME: verify the rate is correct
    job_interval_ms = 14400 : nat64;
    source_subaccount = null;
    min_amount = record { e8s = $MIN_SWAP_AMOUNT : nat64 };
    max_amount = null;
    destination_account = null;
  }"

  ICPSWAP_POOL_ID_ICP_OGY="ttnzy-lyaaa-aaaag-qj2bq-cai"

  EXCHANGE_CONFIG_ICP_OGY="variant {
    ICPSwap = record {
      swap_canister_id = principal \"$ICPSWAP_POOL_ID_ICP_OGY\";
      zero_for_one = false;
    }
  }"
  
  EXCHANGE_JOB_CONFIG_ICP_OGY="record {
    token_to_sell = variant { ICP };
    token_to_buy = variant { OGY };
    exchange = $EXCHANGE_CONFIG_ICP_OGY;
    rate_per_interval = 2_380_950 : nat64; # FIXME: verify the rate is correct
    job_interval_ms = 14400 : nat64;
    source_subaccount = null;
    min_amount = record { e8s = $MIN_SWAP_AMOUNT : nat64 };
    max_amount = null;
    destination_account = null;
  }"

  # Combine all exchange configs into a vector
  EXCHANGE_CONFIGS="vec { $EXCHANGE_JOB_CONFIG_WTN_ICP, $EXCHANGE_JOB_CONFIG_GOLDAO_OGY, $EXCHANGE_JOB_CONFIG_ICP_OGY }"
  ICP_SWAP_CANISTER_ID="7eikv-2iaaa-aaaag-qdgwa-cai"

  ARGUMENTS="(variant { Init = record {
        test_mode = $TESTMODE;
        version = $BUILD_VERSION;
        commit_hash = \"$COMMIT_HASH\";
        authorized_principals = vec {
          principal \"$AUTHORIZED_PRINCIPAL\";
        };
        icp_swap_canister_id = principal \"$ICP_SWAP_CANISTER_ID\";
        exchange_configs = $EXCHANGE_CONFIGS;
      }
    }
  )"


else
  ARGUMENTS="(variant { Upgrade = record {
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
  }})"
fi

. ./scripts/deploy-backend-canister.sh buyback_burn $NETWORK "$ARGUMENTS" $DEPLOYMENT_VIA $VERSION $REINSTALL