#!/usr/bin/env bash

# Following this guide, only one command should be needed to submit the SNS proposal
# https://internetcomputer.org/docs/current/developer-docs/integrations/sns/launching/launch-steps-1proposal#3-submit-nns-proposal-to-create-sns

# Make sure to have your identity selected (dfx identity use <name>), which controls your neuron, to run the command from.
# At least 10 ICP need to be staked in the neuron to be able to submit a proposal
NEURON_ID="2625453517496851295" # dedicate neuron for this proposal

dfx sns propose --network ic --neuron $NEURON_ID sns_init.yaml


# dfx sns threw an error when trying to launch, had to download direct client
curl --fail -L "https://download.dfinity.systems/ic/751b2a0cf904934b4afb62b1457f6bf4f0a20275/binaries/x86_64-darwin/sns.gz" -o sns.gz
./sns propose --network ic --neuron-id 2625453517496851295 sns_init.yaml
