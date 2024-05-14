import { useMutation } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import { ActorSubclass } from "@dfinity/agent";

interface IRequestSwapParams {
  OGYTokenSwapActor: ActorSubclass;
  owner: string;
  blockIndex: bigint | undefined;
}

const requestSwap = async ({
  OGYTokenSwapActor,
  owner,
  blockIndex,
}: IRequestSwapParams) => {
  const resultSwapTokens = await OGYTokenSwapActor.swap_tokens({
    block_index: blockIndex,
    user: [Principal.fromText(owner)],
  });

  return resultSwapTokens;
};

const useRequestSwap = () => {
  const { principal } = useConnect();
  const [OGYTokenSwapActor] = useCanister("OGYTokenSwap");

  return useMutation({
    mutationFn: ({ blockIndex }: { blockIndex: bigint }) =>
      requestSwap({
        OGYTokenSwapActor,
        owner: principal as string,
        blockIndex,
      }),
  });
};

export default useRequestSwap;
