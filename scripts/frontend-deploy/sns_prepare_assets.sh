#!/usr/bin/env bash

# Uploads the built frontend to its asset canister as a proposed batch and
# exports BATCH_ID and EVIDENCE for the proposal. Nothing goes live here: the
# canister keeps serving the current version until SNS governance commits the
# batch.
#
# The identity needs the Prepare permission on the asset canister. Only one
# batch can be proposed at a time. If an earlier proposal was rejected or
# abandoned, delete its batch before running this again:
#   dfx canister call --network ic <canister> delete_batch '(record { batch_id = <id> : nat })'

CANISTER_NAME=$1
NETWORK=$2

LOG_FILE=console.log

echo "
**********************************************************************

Preparing assets for $CANISTER_NAME on $NETWORK

**********************************************************************
"

dfx deploy --network $NETWORK --no-wallet --by-proposal $CANISTER_NAME 2>&1 | tee $LOG_FILE

# dfx reports "Proposed commit of batch <id> with evidence <hash>. Either commit it by proposal or delete it."
PROPOSED=$(grep -oE 'Proposed commit of batch [0-9]+ with evidence [0-9a-f]+' $LOG_FILE | tail -n 1)

echo "Proposed batch line: $PROPOSED"

export BATCH_ID=$(echo "$PROPOSED" | awk '{print $5}')
export EVIDENCE=$(echo "$PROPOSED" | awk '{print $8}')

echo "Batch number: $BATCH_ID, Evidence: $EVIDENCE"

if [[ $BATCH_ID =~ ^[0-9]+$ ]]; then
  echo "Valid batch id: $BATCH_ID"
else
  echo "Invalid batch id: $BATCH_ID"
  exit 1
fi

if [[ $EVIDENCE =~ ^[0-9a-f]{64}$ ]]; then
  echo "Valid evidence: $EVIDENCE"
else
  echo "Invalid evidence: $EVIDENCE"
  exit 1
fi

echo "

Finished preparing assets. Uploaded in batch $BATCH_ID with evidence $EVIDENCE

**********************************************************************
"
