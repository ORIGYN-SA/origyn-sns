#!/usr/bin/env bash
set -euo pipefail

#
# Manual deployment script for token_metrics canister.
# Deploys directly via dfx — no CI/CD tags, no SNS proposals required.
#
# Usage:
#   ./scripts/manual-deploy-token_metrics.sh <NETWORK> [MODE]
#
# Arguments:
#   NETWORK   - Target network: local, staging, or ic
#   MODE      - Optional: "reinstall" for fresh install (wipes state), default is "upgrade"
#
# Examples:
#   ./scripts/manual-deploy-token_metrics.sh staging              # upgrade on staging
#   ./scripts/manual-deploy-token_metrics.sh ic                   # upgrade on ic
#   ./scripts/manual-deploy-token_metrics.sh ic reinstall          # reinstall on ic (wipes state)
#

CANISTER="token_metrics"
NETWORK="${1:?Usage: $0 <local|staging|ic> [reinstall]}"
MODE="${2:-upgrade}"

# Validate network
if [[ ! "$NETWORK" =~ ^(local|staging|ic)$ ]]; then
  echo "Error: NETWORK must be local, staging, or ic. Got: $NETWORK"
  exit 1
fi

# Validate mode
if [[ ! "$MODE" =~ ^(upgrade|reinstall)$ ]]; then
  echo "Error: MODE must be upgrade or reinstall. Got: $MODE"
  exit 1
fi

# --- Version info ---
COMMIT_SHA="$(git rev-parse --short HEAD)_local"

# Extract version from the topmost release heading in CHANGELOG.md.
# Format expected (Keep a Changelog): `## [X.Y.Z] - YYYY-MM-DD`.
CHANGELOG="backend/canisters/${CANISTER}/CHANGELOG.md"
if [[ ! -f "$CHANGELOG" ]]; then
  echo "Error: CHANGELOG not found at $CHANGELOG"
  exit 1
fi

LATEST_VERSION=$(grep -m1 -oE '^## \[[0-9]+\.[0-9]+\.[0-9]+\]' "$CHANGELOG" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || true)
if [[ -z "$LATEST_VERSION" ]]; then
  echo "Error: no versioned heading (## [X.Y.Z]) found in $CHANGELOG"
  exit 1
fi

if [[ "$LATEST_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  VERSION_MAJOR="${BASH_REMATCH[1]}"
  VERSION_MINOR="${BASH_REMATCH[2]}"
  VERSION_PATCH="${BASH_REMATCH[3]}"
  VERSION="$LATEST_VERSION"
else
  echo "Error: failed to parse version '$LATEST_VERSION' from $CHANGELOG"
  exit 1
fi

BUILD_VERSION="record { major = ${VERSION_MAJOR}:nat32; minor = ${VERSION_MINOR}:nat32; patch = ${VERSION_PATCH}:nat32 }"

echo "=== Manual Deploy: $CANISTER ==="
echo "Network:  $NETWORK"
echo "Mode:     $MODE"
echo "Version:  $VERSION"
echo "Commit:   $COMMIT_SHA"
echo ""

# --- Build wasm ---
echo ">>> Building $CANISTER wasm..."
./scripts/build-canister.sh "$CANISTER"

WASM_PATH="backend/canisters/${CANISTER}/target/wasm32-unknown-unknown/release/${CANISTER}_canister.wasm.gz"

if [[ ! -f "$WASM_PATH" ]]; then
  echo "Error: wasm not found at $WASM_PATH"
  exit 1
fi

echo ">>> Wasm built: $WASM_PATH"
echo ""

# --- Construct arguments ---
if [[ "$MODE" == "reinstall" ]]; then
  # Determine canister IDs based on network
  if [[ "$NETWORK" == "local" || "$NETWORK" == "staging" ]]; then
    TESTMODE="true"
    CANISTER_NETWORK="staging"
  else
    TESTMODE="false"
    CANISTER_NETWORK="ic"
  fi

  OGY_LEDGER=$(dfx canister id sns_ledger --network "$CANISTER_NETWORK")
  SNS_GOVERNANCE=$(dfx canister id sns_governance --network "$CANISTER_NETWORK")
  SNS_REWARDS=$(dfx canister id sns_rewards --network "$CANISTER_NETWORK")

  ORIGYN_TREASURY_ACCOUNT="${SNS_GOVERNANCE}.9a703b745d9182542eb16f2d922c9f45c932f29f74acec6c2b807b543fee2383"
  ORIGYN_FOUNDATION_NNS_ACCOUNT="ud7qh-vnh3c-krx66-e2fqy-saxxx-bdyno-2znkq-n5ivx-xeoc6-eygrq-nqe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_DASHBOARD_ACCOUNT="7xc7u-onriy-z2gvh-scsnt-sf3gz-ywjyk-sx2sx-uzqyk-3ugdz-lm7xe-5qe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT="qlqay-cvxyu-k4xzq-ppa5v-2zabq-wmkpe-auxpy-kwels-lkep4-jy462-jqe.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT_2="25v3h-aoa5w-4sjgu-qa34v-qvmq5-q5vbl-lrbeb-arn57-lnslo-uxso7-pae.0000000000000000000000000000000000000000000000000000000000000000"
  ORIGYN_NEURON_MAIN_ACCOUNT="2gytz-5mjny-5qfcl-vjsle-654l2-ixgif-3vfqj-nryxk-uzgfx-5df5u-sqe.0000000000000000000000000000000000000000000000000000000000000000"

  ARGUMENTS="(variant { Init = record {
    test_mode = ${TESTMODE};
    version = ${BUILD_VERSION};
    commit_hash = \"${COMMIT_SHA}\";
    ogy_new_ledger_canister_id = principal \"${OGY_LEDGER}\";
    sns_governance_canister_id = principal \"${SNS_GOVERNANCE}\";
    sns_rewards_canister_id = principal \"${SNS_REWARDS}\";
    treasury_account = \"${ORIGYN_TREASURY_ACCOUNT}\";
    foundation_accounts = vec {
      \"${ORIGYN_FOUNDATION_NNS_ACCOUNT}\";
      \"${ORIGYN_FOUNDATION_DASHBOARD_ACCOUNT}\";
      \"${ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT}\";
      \"${ORIGYN_FOUNDATION_OPERATIONAL_ACCOUNT_2}\";
      \"${ORIGYN_NEURON_MAIN_ACCOUNT}\"
    };
    authorized_principals = vec {
      principal \"${SNS_GOVERNANCE}\"
    }
  }})"
else
  ARGUMENTS="(variant { Upgrade = record {
    version = ${BUILD_VERSION};
    commit_hash = \"${COMMIT_SHA}\";
  }})"
fi

# --- Deploy ---
echo ">>> Deploying $CANISTER to $NETWORK (mode: $MODE)..."
echo ""

if [[ "$MODE" == "reinstall" ]]; then
  dfx canister install "$CANISTER" \
    --network "$NETWORK" \
    --mode reinstall \
    --argument "$ARGUMENTS" \
    --wasm "$WASM_PATH" \
    -y
else
  echo ">>> Stopping canister..."
  dfx canister stop "$CANISTER" --network "$NETWORK" || true

  echo ">>> Installing upgrade..."
  dfx canister install "$CANISTER" \
    --network "$NETWORK" \
    --mode upgrade \
    --argument "$ARGUMENTS" \
    --wasm "$WASM_PATH" \
    -y

  echo ">>> Starting canister..."
  dfx canister start "$CANISTER" --network "$NETWORK"
fi

echo ""
echo "=== Deploy complete ==="
echo "Canister: $CANISTER"
echo "Network:  $NETWORK"
echo "Mode:     $MODE"
echo "Version:  $VERSION ($COMMIT_SHA)"
