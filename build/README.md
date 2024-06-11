
# Reproducible builds

## Install Lima

Follow the instructions at [https://github.com/lima-vm/lima#installation](https://github.com/lima-vm/lima#installation).
You can use this config file to start: [https://github.com/lima-vm/lima/blob/master/examples/docker.yaml](https://github.com/lima-vm/lima/blob/master/examples/docker.yaml) and run the commands below.

Note: If you are running on an ARM chip (e.g. Apple M1), you have to add the line `arch: "x86_64"` to the top of the `docker.yaml` file (see more infos about this [here](https://lima-vm.io/docs/config/multi-arch/)). This will drastically reduce the execution speed of this (building can take >1hr), however, is required on ARM chips! See [`build/docker.yaml`](build/docker.yaml) for an example.

```sh
limactl start docker.yaml
docker context create lima-docker --docker "host=unix:///Users/$USER/.lima/docker/sock/docker.sock"
docker context use lima-docker
```

## Building the Reproducible Image

This step can take a while. Sit back and enjoy some coffee:

```sh
docker build -t origyn_reproducible_build -f ./build/Dockerfile_backend .
```

## Running the Reproducible Build

Define the canister you want to build. Check the valid canister names in the file [canister_ids.json](../canister_ids.json),

```sh
export CANISTER_NAME=<THE_CANISTER_NAME>
```

e.g.

```sh
export CANISTER_NAME=ogy_token_swap
```

Build the canister

```sh
docker run -v /tmp/lima/:/builds/origyn/origyn-sns/backend/canisters/$CANISTER_NAME/target/wasm32-unknown-unknown/release/ -e CANISTER_NAME=$CANISTER_NAME origyn_reproducible_build
```

## Generated WASM Files

```sh
/tmp/lima/$CANISTER_NAME.wasm
/tmp/lima/$CANISTER_NAME_canister.wasm
/tmp/lima/$CANISTER_NAME_canister.wasm.gz
```

## Verify the integrity of the files by computing their SHA256 hashes

We are currently using the `$CANISTER_NAME_canister.wasm.gz` in production, so you can check using:

```sh
shasum -a 256 /tmp/lima/${CANISTER_NAME}_canister.wasm.gz
```

Compare this value to the wasm hash that is provided with the upgrade proposal.
