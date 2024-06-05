#!/usr/bin/env bash

show_help() {
  cat << EOF
Generate the candid file and declarations for the mentioned wasm canister.
Must be run from the repository's root folder.

Usage:
  scripts/generate-did [options] <wasm>

Options:
  -h, --help        Show this message and exit
  -o, --output PATH The path where to write the resulting candid file (Must be a folder)
  -d, --dry-run     Only output the result, without actually writing on disk
EOF
}

if [[ $# -gt 0 ]]; then
  while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do
    case $1 in
      -h | --help )
        show_help
        exit
        ;;
      -o | --output )
        shift; outpath=$1
        ;;
      -d | --dry-run )
        dryrun=1
        ;;
    esac;
    shift;
  done
  if [[ "$1" == '--' ]]; then shift; fi
else
  echo "Error: not enough arguments."
  show_help
  exit 1
fi

excluded_canisters=(super_stats_v3)
for can in "${excluded_canisters[@]}"; do
  if [[ "$can" == "$1" ]]; then
    echo "Excluding $can because its can.did is written manually."
    exit 0
  fi
done

defaultpath="backend/canisters/$1/api"
did_path="${outpath:-$defaultpath}"
if [[ $dryrun -eq 1 ]]; then
  echo -e "This would be written to ${did_path}/${1}.did :\n"
  candid-extractor "backend/canisters/$1/target/wasm32-unknown-unknown/release/${1}.wasm"
else
  candid-extractor "backend/canisters/$1/target/wasm32-unknown-unknown/release/${1}.wasm" > $did_path/can.did
fi
