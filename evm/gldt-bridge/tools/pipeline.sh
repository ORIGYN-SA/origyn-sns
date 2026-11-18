#!/usr/bin/env bash
# The steps of the GLDT bridge pipeline (scripts/ci-cd/.gldt_bridge_evm.yml).
# TARGET is a network (mainnet: ethereum and base; testnet: sepolia and base-sepolia) or one chain.
#
#   tools/pipeline.sh dry-run <target>   simulate the deploy from the config's operator; no key, nothing is sent
#   tools/pipeline.sh deploy <chain>     deploy on one chain with GLDT_BRIDGE_OPERATOR_KEY (hex or PEM, see operator-key.js)
#   tools/pipeline.sh check <target>     Check.s.sol against deployments/<chain>.json
#   tools/pipeline.sh verify <target>    verify the implementation source with GLDT_BRIDGE_ETHERSCAN_KEY
#   tools/pipeline.sh pause <target>     operator pause; PAUSE_LZ and PAUSE_ICP (true or false, default true)
#   tools/pipeline.sh address <target>   the GLDT address that the config's operator and salt give
#   tools/pipeline.sh operator <target>  the wallet of GLDT_BRIDGE_OPERATOR_KEY (only its address), and whether the configs name it
#
# RPC: GLDT_BRIDGE_RPC_URL when set (one RPC for every chain, for a local anvil fork), else Alchemy with
# GLDT_BRIDGE_ALCHEMY_KEY, else the public publicnode endpoints.
# The key reaches forge and cast as an argument: never run this with `set -x`.
set -euo pipefail
cd "$(dirname "$0")/.."

CREATEX=0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed
ZERO_ADDRESS=0x0000000000000000000000000000000000000000

die() {
    echo "error: $*" >&2
    exit 1
}

chains() {
    case "$1" in
        mainnet) echo "ethereum base" ;;
        testnet) echo "sepolia base-sepolia" ;;
        ethereum | base | sepolia | base-sepolia) echo "$1" ;;
        *) die "unknown network or chain: $1" ;;
    esac
}

rpc_url() {
    local alchemy public
    case "$1" in
        ethereum) alchemy=eth-mainnet public=ethereum-rpc.publicnode.com ;;
        base) alchemy=base-mainnet public=base-rpc.publicnode.com ;;
        sepolia) alchemy=eth-sepolia public=ethereum-sepolia-rpc.publicnode.com ;;
        base-sepolia) alchemy=base-sepolia public=base-sepolia-rpc.publicnode.com ;;
    esac
    if [ -n "${GLDT_BRIDGE_RPC_URL:-}" ]; then
        echo "$GLDT_BRIDGE_RPC_URL"
    elif [ -n "${GLDT_BRIDGE_ALCHEMY_KEY:-}" ]; then
        echo "https://$alchemy.g.alchemy.com/v2/$GLDT_BRIDGE_ALCHEMY_KEY"
    else
        echo "https://$public"
    fi
}

# One top-level field of a JSON file.
json() {
    node -e 'process.stdout.write(String(require(require("path").resolve(process.argv[1]))[process.argv[2]]))' "$1" "$2"
}

config() { json "script/config/$1.json" "$2"; }

lower() { echo "$1" | tr '[:upper:]' '[:lower:]'; }

need() { [ -n "${!1:-}" ] || die "$1 is not set; it comes from the protected environment"; }

# The operator key as hex, from GLDT_BRIDGE_OPERATOR_KEY in any form operator-key.js reads.
load_operator_key() {
    local hex
    hex=$(node tools/operator-key.js)
    OPERATOR_KEY=0x$hex
}

# The key's wallet, which must be the config's operator.
key_address() {
    local address
    address=$(cast wallet address --private-key "$OPERATOR_KEY")
    [ "$(lower "$address")" = "$(lower "$(config "$1" operator)")" ] ||
        die "the key's wallet $address is not the operator in script/config/$1.json"
    echo "$address"
}

# The CreateX CREATE3 address of the config's operator and salt, as Deploy.s.sol computes it.
token_address() {
    local guarded
    guarded=$(cast keccak "$(cast abi-encode 'f(address,bytes32)' "$(config "$1" operator)" "$(config "$1" salt)")")
    cast call "$CREATEX" 'computeCreate3Address(bytes32)(address)' "$guarded" --rpc-url "$(rpc_url "$1")"
}

dry_run() {
    local chain operator token code
    for chain in $(chains "$1"); do
        operator=$(config "$chain" operator)
        if [ "$operator" = "$ZERO_ADDRESS" ]; then
            echo "$chain: skipped, the operator and salt are not set in script/config/$chain.json"
            continue
        fi
        token=$(token_address "$chain")
        code=$(cast code "$token" --rpc-url "$(rpc_url "$chain")")
        if [ "$code" != 0x ]; then
            echo "$chain: skipped, GLDT is already deployed at $token"
            continue
        fi
        echo "$chain: simulating the deploy from $operator"
        forge script script/Deploy.s.sol --sig 'run(string,string)' \
            "script/config/$chain.json" "deployments/dryrun-$chain.json" \
            --rpc-url "$(rpc_url "$chain")" --sender "$operator"
    done
}

deploy() {
    [ "$(chains "$1")" = "$1" ] || die "deploy takes one chain, not a network"
    [ -n "${GLDT_BRIDGE_RPC_URL:-}${GLDT_BRIDGE_ALCHEMY_KEY:-}" ] || die "deploy needs GLDT_BRIDGE_ALCHEMY_KEY"
    local address token
    load_operator_key
    address=$(key_address "$1")
    token=$(token_address "$1")
    echo "$1: deploying from $address, GLDT at $token"
    forge script script/Deploy.s.sol --sig 'run(string)' "$1" \
        --rpc-url "$(rpc_url "$1")" --private-key "$OPERATOR_KEY" --broadcast --slow
}

check() {
    local chain failed=0
    for chain in $(chains "$1"); do
        echo "$chain: checking deployments/$chain.json"
        forge script script/Check.s.sol --sig 'run(string)' "$chain" --rpc-url "$(rpc_url "$chain")" || failed=1
    done
    [ "$failed" = 0 ] || die "a check failed"
}

verify() {
    need GLDT_BRIDGE_ETHERSCAN_KEY
    local chain implementation chain_id constructor_args failed=0
    for chain in $(chains "$1"); do
        implementation=$(json "deployments/$chain.json" implementation)
        chain_id=$(config "$chain" chainId)
        constructor_args=$(cast abi-encode 'constructor(address)' "$(config "$chain" endpoint)")
        echo "$chain: verifying the implementation $implementation"
        ETHERSCAN_API_KEY="$GLDT_BRIDGE_ETHERSCAN_KEY" forge verify-contract "$implementation" src/GLDT.sol:GLDT \
            --chain "$chain_id" --constructor-args "$constructor_args" --watch || failed=1
    done
    [ "$failed" = 0 ] || die "a verification failed"
}

# Not under `set -e` (it runs in an `if`), so every step returns on failure itself.
pause_chain() {
    local chain=$1 lz=$2 icp=$3 url address token code operator
    url=$(rpc_url "$chain")
    address=$(key_address "$chain") || return 1
    token=$(token_address "$chain") || return 1
    code=$(cast code "$token" --rpc-url "$url") || return 1
    [ "$code" != 0x ] || {
        echo "$chain: no GLDT at $token" >&2
        return 1
    }
    operator=$(cast call "$token" 'operator()(address)' --rpc-url "$url") || return 1
    [ "$(lower "$operator")" = "$(lower "$address")" ] || {
        echo "$chain: the token's operator is $operator, not $address" >&2
        return 1
    }
    echo "$chain: pause(lz $lz, icp $icp) on $token"
    cast send "$token" 'pause(bool,bool)' "$lz" "$icp" \
        --private-key "$OPERATOR_KEY" --rpc-url "$url" || return 1
    echo "$chain: paused() is now $(cast call "$token" 'paused()(bool,bool)' --rpc-url "$url" | tr '\n' ' ')"
}

# A failure on one chain does not stop the pause on the other.
pause() {
    local lz=${PAUSE_LZ:-true} icp=${PAUSE_ICP:-true} chain failed=0
    for value in "$lz" "$icp"; do
        [ "$value" = true ] || [ "$value" = false ] || die "PAUSE_LZ and PAUSE_ICP must be true or false"
    done
    [ "$lz" = true ] || [ "$icp" = true ] || die "nothing to pause: PAUSE_LZ and PAUSE_ICP are both false"
    [ -n "${GLDT_BRIDGE_RPC_URL:-}${GLDT_BRIDGE_ALCHEMY_KEY:-}" ] || die "pause needs GLDT_BRIDGE_ALCHEMY_KEY"
    load_operator_key
    for chain in $(chains "$1"); do
        if ! pause_chain "$chain" "$lz" "$icp"; then
            echo "$chain: the pause FAILED" >&2
            failed=1
        fi
    done
    [ "$failed" = 0 ] || die "the pause failed on a chain, see above"
}

show_operator() {
    local address chain operator
    load_operator_key
    address=$(cast wallet address --private-key "$OPERATOR_KEY")
    echo "GLDT_BRIDGE_OPERATOR_KEY is the wallet $address"
    for chain in $(chains "$1"); do
        operator=$(config "$chain" operator)
        if [ "$(lower "$operator")" = "$(lower "$address")" ]; then
            echo "$chain: script/config/$chain.json names this wallet"
        else
            echo "$chain: script/config/$chain.json names $operator, not this wallet"
        fi
    done
}

show_address() {
    local chain
    for chain in $(chains "$1"); do
        echo "$chain: $(token_address "$chain")"
    done
}

[ $# -eq 2 ] || die "usage: tools/pipeline.sh dry-run|deploy|check|verify|pause|address|operator <mainnet|testnet|chain>"
chains "$2" >/dev/null
case "$1" in
    dry-run) dry_run "$2" ;;
    deploy) deploy "$2" ;;
    check) check "$2" ;;
    verify) verify "$2" ;;
    pause) pause "$2" ;;
    address) show_address "$2" ;;
    operator) show_operator "$2" ;;
    *) die "unknown step: $1" ;;
esac
