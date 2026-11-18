#!/usr/bin/env bash

# Checks what the upgrade proposal needs before the build is uploaded. A job
# that fails after the upload leaves a proposed batch on the asset canister,
# and no other batch can be proposed until that one is deleted by hand.

CONFIG_FRONTEND="scripts/frontend-deploy/frontend_config.json"

CANISTER_NAME=$1
VERSION=$2

FAILED=0

for TOOL in dfx quill didc jq; do
  if ! command -v $TOOL > /dev/null; then
    echo "Error: $TOOL is not installed"
    FAILED=1
  fi
done

FID=$(jq -r --arg fe "$CANISTER_NAME" '.[$fe].sns_function_id' $CONFIG_FRONTEND)

if [[ ! $FID =~ ^[0-9]+$ ]]; then
  echo "Error: no sns_function_id for $CANISTER_NAME in $CONFIG_FRONTEND"
  FAILED=1
fi

if [[ -z $SNS_PROPOSER_NEURON_ID_PRODUCTION ]]; then
  echo "Error: SNS_PROPOSER_NEURON_ID_PRODUCTION is not set"
  FAILED=1
fi

if [[ -z $PEM_FILE || ! -r $PEM_FILE ]]; then
  echo "Error: PEM_FILE is not set or cannot be read"
  FAILED=1
fi

# The changelog entry of the version becomes the summary of the proposal.
if ! ./scripts/parse_changelog.sh "$CANISTER_NAME" "$VERSION" frontend; then
  FAILED=1
fi

if [[ $FAILED -ne 0 ]]; then
  echo "Nothing was uploaded to the asset canister."
  exit 1
fi

echo "Proposal inputs for $CANISTER_NAME $VERSION are complete."
