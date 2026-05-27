import { useMutation } from "@tanstack/react-query";
import { useWallet } from "@components/auth/useWallet";
import { getActor } from "@services/actor";
import { Principal } from "@dfinity/principal";
import { requireVariant } from "@services/queries/utils/variant";

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

  return requireVariant<bigint>(
    resultSwapTokens,
    "Success",
    "Swap request failed"
  );
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
