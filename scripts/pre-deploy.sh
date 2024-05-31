#!/usr/bin/env bash

show_help() {
  cat << EOF
Pre-deployment commands.
Must be run from the repository's root folder, and with a running replica for local deployment.
'staging' and 'ic' networks can only be selected from a Gitlab CI/CD environment.

Usage:
  scripts/pre-deploy [options]

Options:
  -h, --help        Show this message and exit
  --network NETWORK The network where the commands will be executed (default is 'local')
EOF
}

source "scripts/config.sh"

export NETWORK="local"

if [[ $# -gt 0 ]]; then
  while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do
    case $1 in
      -h | --help )
        show_help
        exit
        ;;
      --network )
        shift; export NETWORK=$1
        ;;
    esac;
    shift;
  done
  if [[ "$1" == '--' ]]; then shift; fi
fi

# Arguments:
# $1: Canister name
# $2: Network name (optional)
# $3: Memory amount to allocate (optional)
create_canister () {
	if [[ -n "${3}" ]]; then
		export MEMALLOC="--memory-allocation ${3}"
		echo -e "Memory allocation for ${2}:\t${3} B"
	fi
	if [[ $2 == "local" ]]; then
		dfx canister create $MEMALLOC $1
		CANISTER_ID=$(dfx canister id $1)
	elif [[ ($2 == "staging" || $2 == "ic") && $CI ]]; then
		dfx canister create $MEMALLOC $1 --network $2
		CANISTER_ID=$(dfx canister id $1 --network $2)
	else
		echo "Error during canister creation: unknown network ${2}"
		exit 1
	fi
	echo $CANISTER_ID
}

# Arguments:
# $1: Canister name
# $2: Network name (optional)
# $3: Memory amount to allocate (optional)
check_and_create_canister () {
	if [[ $2 == "local" ]]; then
		echo $(dfx canister id $1 2>/dev/null || echo $(create_canister $1 $2 $3))
	elif [[ ($2 == "staging" && $CI) || ($2 == "ic" && $CI_COMMIT_TAG =~ ^(ledger|core|swap_app)-v{1}[[:digit:]]{1,2}.[[:digit:]]{1,2}.[[:digit:]]{1,3}$) ]]; then
		if [[ $(cat canister_ids.json | jq -r .$1.$2) == "" ]]; then
			echo $(create_canister $1 $2 $3)
		else
			echo $(cat canister_ids.json | jq -r .$1.$2)
			if [[ -n "${3}" ]]; then
				dfx canister update-settings --memory-allocation $3 --network $2 $1
			fi
		fi
	else
		echo "Error: unknown network ${2}"
		exit 1
	fi
}

echo -e "\nCanisters IDs on $NETWORK:\n"
IMPORTANT_MSG=""
echo -e "Backend canisters:"
for canister in $BACKEND_CANISTERS; do
	export CANISTER_ID=$(check_and_create_canister $canister $NETWORK)
	echo -e "$canister      \033[1m${CANISTER_ID}\033[0m${IMPORTANT_MSG}"
done
echo -e "\nFrontend canisters:"
for canister in $FRONTEND_CANISTERS; do
	export CANISTER_ID=$(check_and_create_canister $canister $NETWORK)
	echo -e "$canister      \033[1m${CANISTER_ID}\033[0m${IMPORTANT_MSG}"
done


if [[ ($NETWORK == "staging" || $NETWORK == "ic") && $CI ]]; then
	echo -e "\n  \033[1;5;31mIMPORTANT\033[0m  If a canister id has just been created on \033[7m${NETWORK}\033[0m. Please update and version \033[4m'canister_ids.json'\033[0m on both the \033[7m'master'\033[0m and \033[7m'develop'\033[0m branches ASAP.\n"
fi
