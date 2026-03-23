#!/usr/bin/env bash

NETWORK=$1
DEPLOYMENT_VIA="direct"

. ./scripts/extract_commit_tag_data_and_commit_sha.sh canister_jobs $NETWORK

if [[ $REINSTALL == "reinstall" ]]; then

  if [[ $NETWORK =~ ^(local|staging)$ ]]; then
    TESTMODE="true"
    OGY_LEDGER=$(dfx canister id sns_ledger --network staging)
    SNS_GOVERNANCE=$(dfx canister id sns_governance --network staging)
  elif [[ $NETWORK =~ ^(ic)$ ]]; then
    TESTMODE="false"
    OGY_LEDGER=$(dfx canister id sns_ledger --network "$NETWORK")
    SNS_GOVERNANCE=$(dfx canister id sns_governance --network "$NETWORK")
  else
    echo "Error: unknown network for deployment. Found $NETWORK."
    exit 2
  fi

  ARGUMENTS="(
    variant {
      Init = record {
        test_mode = $TESTMODE;
        daily_burn_amount = 164_500_000_000 : nat64;
        burn_principal_id = principal \"$SNS_GOVERNANCE\";
        ledger_canister_id = principal \"$OGY_LEDGER\";
        authorized_principals = vec {
          principal \"$SNS_GOVERNANCE\"
        }
      }
    }
  )"

else
  ARGUMENTS="(variant { Upgrade = record {
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
  }})"
fi

. ./scripts/deploy-backend-canister.sh canister_jobs $NETWORK "$ARGUMENTS" $DEPLOYMENT_VIA $VERSION $REINSTALL
