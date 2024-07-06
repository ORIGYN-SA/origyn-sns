import { useMutation } from "@tanstack/react-query";
import { useWallet, getActor } from "@amerej/artemis-react";
import { Principal } from "@dfinity/principal";

const requestSwap = async ({
  owner,
  blockIndex,
}: {
  owner: string;
  blockIndex: bigint | undefined;
}) => {
  const actor = await getActor("OGYTokenSwap", { isAnon: false });
  const resultSwapTokens = await actor.swap_tokens({
    block_index: blockIndex,
    user: [Principal.fromText(owner)],
  });

  return resultSwapTokens;
};

const useRequestSwap = () => {
  const { principalId } = useWallet();

  return useMutation({
    mutationFn: ({ blockIndex }: { blockIndex: bigint }) =>
      requestSwap({
        owner: principalId as string,
        blockIndex,
      }),
  });
};

export default useRequestSwap;
