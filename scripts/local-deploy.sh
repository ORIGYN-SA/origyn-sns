#!/usr/bin/env bash

source "scripts/config.sh"

. scripts/pre-deploy.sh --network ${NETWORK} && \
if [[ $? != 0 ]]; then
	exit 1;
fi

echo -e "\nDeploying canisters on $NETWORK:\n"
for canister in $BACKEND_CANISTERS; do
	echo "Deploying $canister on ${NETWORK}"
	. ./scripts/canister-deploy/deploy-$canister.sh $NETWORK
done
echo -e "\nFrontend canisters:"
for canister in $FRONTEND_CANISTERS; do
	echo "Deploying $canister on ${NETWORK}"
	dfx deploy --network ${NETWORK} ogy_dashboard
done
