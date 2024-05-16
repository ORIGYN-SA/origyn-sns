#!/usr/bin/env bash

show_help() {
  cat << EOF
Build canisters and run integration tests.
Must be run from the repository's root folder.

Usage:
  scripts/run-integration-tests.sh [options]

Options:
  -f, --fast        Only runs the integration tests without rebuilding the canister code
  -h, --help        Show this message and exit
EOF
}

BUILD=true

if [[ $# -gt 0 ]]; then
  while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do
    case $1 in
      -h | --help )
        show_help
        exit
        ;;
      -n | --no-build )
        BUILD=false
        ;;
    esac;
    shift;
  done
  if [[ "$1" == '--' ]]; then shift; fi
fi

if $BUILD; then
  ./scripts/build-all-canister.sh -it
fi

./scripts/init-integration-test-environment.sh

cargo test -p integration_tests -- --nocapture
