#!/usr/bin/env bash

show_help() {
  cat << EOF
ogy_token_swap canister deployment script.
Usage:
  scripts/deploy-ogy_token_swap.sh [options] <NETWORK>
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
MODE="proposal"

# 1. Extract metadata (Populates $BUILD_VERSION and $COMMIT_SHA)
. ./scripts/extract_commit_tag_data_and_commit_sha.sh ogy_token_swap $NETWORK

# 2. Network-specific configuration
if [[ $NETWORK =~ ^(local|staging)$ ]]; then
  TESTMODE="true"
  # For local/staging, use current identity as the authorized principal
  OGY_LEGACY_MINTING_ACCOUNT_PRINCIPAL="$(dfx identity get-principal)"
  AUTHORIZED_PRINCIPALS="principal \"$(dfx identity get-principal)\""
  OGY_LEGACY_LEDGER=$(dfx canister id ogy_legacy_ledger --network staging)
  OGY_NEW_LEDGER=$(dfx canister id sns_ledger --network staging)
else
  TESTMODE="false"
  OGY_LEGACY_MINTING_ACCOUNT_PRINCIPAL="aomfs-vaaaa-aaaaj-aadoa-cai"
  AUTHORIZED_PRINCIPALS="principal \"f32hc-unijf-rec4q-dgwlt-ebht6-ka37e-wkv5x-24b4l-hnffi-zk27x-7ae\""
  OGY_LEGACY_LEDGER=$(dfx canister id ogy_legacy_ledger --network $NETWORK)
  OGY_NEW_LEDGER=$(dfx canister id sns_ledger --network $NETWORK)
fi

# 3. Construct Enum-wrapped Arguments
if [[ $REINSTALL == "reinstall" ]]; then
  # Matches: Args::Init(InitArgs)
  ARGUMENTS="(variant { Init = record {
    test_mode = $TESTMODE;
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
    ogy_legacy_ledger_canister_id = principal \"$OGY_LEGACY_LEDGER\";
    ogy_new_ledger_canister_id = principal \"$OGY_NEW_LEDGER\";
    ogy_legacy_minting_account_principal = principal \"$OGY_LEGACY_MINTING_ACCOUNT_PRINCIPAL\";
    authorized_principals = vec { $AUTHORIZED_PRINCIPALS };
  }})"
else
  # Matches: Args::Upgrade(UpgradeArgs)
  ARGUMENTS="(variant { Upgrade = record {
    version = $BUILD_VERSION;
    commit_hash = \"$COMMIT_SHA\";
  }})"
fi

# 4. Execute deployment
. ./scripts/deploy-backend-canister.sh ogy_token_swap $NETWORK "$ARGUMENTS" $MODE $VERSION $REINSTALL