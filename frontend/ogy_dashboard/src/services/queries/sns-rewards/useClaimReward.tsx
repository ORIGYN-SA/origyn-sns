import { useMutation } from "@tanstack/react-query";
import { useWallet } from "@components/auth/useWallet";
import { getActor } from "@services/actor";
import { requireVariant } from "@services/queries/utils/variant";

type NeuronId = { id: number[] };
type ClaimRewardArgs = { neuronId: NeuronId };

type ClaimRewardsArgs = {
  neuronIds: NeuronId[];
};

export const claimReward = async ({ neuronId }: ClaimRewardArgs) => {
  const actor = await getActor("SNSRewards", { isAnon: false });
  const result = await actor.claim_reward({
    token: "OGY",
    neuron_id: neuronId,
  });
  return requireVariant<boolean>(result, "Ok", "Claim reward failed");
};

const claimRewards = async ({ neuronIds }: ClaimRewardsArgs) => {
  const actor = await getActor("SNSRewards", { isAnon: false });
  const results = await Promise.all(
    neuronIds.map((neuronId) =>
      actor.claim_reward({
        token: "OGY",
        neuron_id: neuronId,
      })
    )
  );

  results.forEach((result) =>
    requireVariant<boolean>(result, "Ok", "Claim reward failed")
  );
  return true;
};

const assertDefaultAccount = (subAccount: unknown) => {
  if (subAccount) {
    throw new Error(
      "Reward claims are only supported for the principal default account."
    );
  }
};

const useClaimReward = () => {
  const { subAccount } = useWallet();

  return useMutation({
    mutationFn: ({ neuronId }: ClaimRewardArgs) => {
      assertDefaultAccount(subAccount);
      return claimReward({ neuronId });
    },
  });
};

export const useClaimRewards = () => {
  const { subAccount } = useWallet();

  return useMutation({
    mutationFn: ({ neuronIds }: ClaimRewardsArgs) => {
      assertDefaultAccount(subAccount);
      return claimRewards({ neuronIds });
    },
  });
};

export default useClaimReward;
