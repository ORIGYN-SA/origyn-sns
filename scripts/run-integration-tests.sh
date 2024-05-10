#!/usr/bin/env bash

show_help() {
  cat << EOF
Build canisters and run integration tests.
Must be run from the repository's root folder.

Usage:
  scripts/run-integration-tests.sh [options]

Options:
  -h, --help        Show this message and exit
EOF
}

./scripts/build-all-canister.sh

cargo test -p integration_tests -- --nocapture
