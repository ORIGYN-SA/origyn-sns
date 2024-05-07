import { useMutation } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import { ActorSubclass } from "@dfinity/agent";

interface IClaimReward {
  snsRewardsActor: ActorSubclass;
  neuronId: { id: number[] };
}

const claimReward = async ({ snsRewardsActor, neuronId }: IClaimReward) => {
  // const id = [...Uint8Array.from(Buffer.from(neuronId, "hex"))];
  const result = await snsRewardsActor.claim_reward(neuronId, "OGY");
  return result;
};

const useClaimReward = () => {
  const [snsRewardsActor] = useCanister("SNSRewards");

  return useMutation({
    mutationFn: ({ neuronId }: { neuronId: { id: number[] } }) =>
      claimReward({
        snsRewardsActor,
        neuronId,
      }),
  });
};

export default useClaimReward;
