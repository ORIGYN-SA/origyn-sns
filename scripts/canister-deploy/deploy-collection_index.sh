#!/usr/bin/env bash

show_help() {
  cat << EOF
collection_index canister deployment script.
Usage:
  scripts/deploy-collection_index.sh [options] <NETWORK>
EOF
}

if [[ $# -gt 0 ]]; then
  while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do
    case $1 in
      -h | --help ) show_help; exit ;;
    esac;
    shift;
  done
else
  echo "Error: missing <NETWORK> argument"
  exit 1
fi

NETWORK=$1
MODE="direct"

# 1. Extract metadata (Populates $BUILD_VERSION and $COMMIT_SHA)
. ./scripts/extract_commit_tag_data_and_commit_sha.sh collection_index $NETWORK

# 2. Network-specific configuration
if [[ $NETWORK =~ ^(local|staging)$ ]]; then
  TESTMODE="true"
else
  TESTMODE="false"
fi

# 3. Construct Enum-wrapped Arguments
if [[ $REINSTALL == "reinstall" ]]; then
  # Matches: Args::Init(InitArgs)
  SNS_GOVERNANCE=$(dfx canister id sns_governance --network staging)
  ARGUMENTS="(variant { Init = record {
    test_mode = $TESTMODE;
    version = $BUILD_VERSION;
    authorized_principals = vec { principal \"jqdha-t6k7d-iitf4-6mxtc-dzkp2-kpk7c-mmtnp-ab2ef-xotlg-5m5qc-3qe\"; principal \"$SNS_GOVERNANCE\"; ;
  }})"
else
  # Matches: Args::Upgrade(UpgradeArgs)
  ARGUMENTS="(variant { Upgrade = record {
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
  }})"
fi

# 4. Execute deployment
. ./scripts/deploy-backend-canister.sh collection_index $NETWORK "$ARGUMENTS" $MODE $VERSION $REINSTALL