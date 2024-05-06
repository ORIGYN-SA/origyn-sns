import { useMutation } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import { ActorSubclass } from "@dfinity/agent";

interface IClaimReward {
  snsRewardsActor: ActorSubclass;
  id: string;
}

const claimReward = async ({ snsRewardsActor, id }: IClaimReward) => {
  // const id = [...Uint8Array.from(Buffer.from(neuronId, "hex"))];
  const result = await snsRewardsActor.claim_reward({
    id,
  });
  return result;
};

const useClaimReward = () => {
  const [snsRewardsActor] = useCanister("SNSRewards");

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      claimReward({
        snsRewardsActor,
        id,
      }),
  });
};

export default useClaimReward;
