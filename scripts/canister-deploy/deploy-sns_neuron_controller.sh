#!/usr/bin/env bash

NETWORK=$1
DEPLOYMENT_VIA="proposal"

# Thresholds
ICP_REWARDS_THRESHOLD="1_000_000"
OGY_REWARDS_THRESHOLD="20_000_000"
GOLDAO_REWARDS_THRESHOLD="10_000_000"
GLDT_REWARDS_THRESHOLD="1_000_000_000"
WTN_REWARDS_THRESHOLD="100_000_000"

. ./scripts/extract_commit_tag_data_and_commit_sha.sh sns_neuron_controller $NETWORK

if [[ $REINSTALL == "reinstall" ]]; then

  if [[ $NETWORK =~ ^(local|staging)$ ]]; then
    TESTMODE=true

    DEX_INTERACTION=$(dfx canister id dex_interaction --network "$NETWORK")
    AUTHORIZED_PRINCIPALS=$(dfx identity get-principal)

    GOLDAO_SNS_GOVERNANCE_ID=j3ioe-7iaaa-aaaap-ab23q-cai
    GOLDAO_SNS_LEDGER_ID=irhm6-5yaaa-aaaap-ab24q-cai
    GOLDAO_SNS_REWARDS_ID=rbv23-fqaaa-aaaam-qbfma-cai

    OGY_DESTINATION=fpmqz-aaaaa-aaaag-qjvua-cai

  elif [[ $NETWORK =~ ^(ic)$ ]]; then
    TESTMODE=false

    DEX_INTERACTION=$(dfx canister id dex_interaction --network "$NETWORK")
    AUTHORIZED_PRINCIPALS=$(dfx canister id sns_governance --network "$NETWORK")

    GOLDAO_SNS_GOVERNANCE_ID=tr3th-kiaaa-aaaaq-aab6q-cai
    GOLDAO_SNS_LEDGER_ID=tyyy3-4aaaa-aaaaq-aab7a-cai
    GOLDAO_SNS_REWARDS_ID=iyehc-lqaaa-aaaap-ab25a-cai

    OGY_DESTINATION=yuijc-oiaaa-aaaap-ahezq-cai

  else
    echo "Error: unknown network for deployment. Found $NETWORK."
    exit 2
  fi

  ARGUMENTS="(
    variant {
      Init = record {
        test_mode = $TESTMODE;
        version = $BUILD_VERSION;
        commit_hash = \"$COMMIT_SHA\";

        authorized_principals = vec {
          principal \"$AUTHORIZED_PRINCIPALS\"
        };

        goldao_manager_config = record {
          goldao_sns_governance_canister_id = principal \"$GOLDAO_SNS_GOVERNANCE_ID\";
          goldao_sns_ledger_canister_id = principal \"$GOLDAO_SNS_LEDGER_ID\";
          goldao_sns_rewards_canister_id = principal \"$GOLDAO_SNS_REWARDS_ID\";

          reward_tokens = vec {

            record {
              variant { GOLDAO };
              record {
                destination = principal \"$DEX_INTERACTION\";
                threshold = ($GOLDAO_REWARDS_THRESHOLD : nat);
              }
            };

            record {
              variant { OGY };
              record {
                destination = principal \"$OGY_DESTINATION\";
                threshold = ($OGY_REWARDS_THRESHOLD : nat);
              }
            };

            record {
              variant { ICP };
              record {
                destination = principal \"$DEX_INTERACTION\";
                threshold = ($ICP_REWARDS_THRESHOLD : nat);
              }
            };

            record {
              variant { WTN };
              record {
                destination = principal \"$DEX_INTERACTION\";
                threshold = ($WTN_REWARDS_THRESHOLD : nat);
              }
            };

            record {
              variant { GLDT };
              record {
                destination = principal \"$DEX_INTERACTION\";
                threshold = ($GLDT_REWARDS_THRESHOLD : nat);
              }
            };
          };
        };
      }
    }
  )"

else
  ARGUMENTS="(variant { Upgrade = record {
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
  }})"
fi

. ./scripts/deploy-backend-canister.sh sns_neuron_controller $NETWORK "$ARGUMENTS" $DEPLOYMENT_VIA $VERSION $REINSTALL
