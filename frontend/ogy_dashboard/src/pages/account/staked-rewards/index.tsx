import { useWallet } from "artemis-react";
import { Card } from "@components/ui";
import {
  ClaimAllRewardsProvider,
  BtnClaimAllRewards,
  DialogClaimAllRewards,
} from "@pages/account/staked-rewards/claim-all-rewards";
import useNeurons from "@hooks/neurons/useNeuronsOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";
import { Skeleton } from "@components/ui";

const StakedRewards = () => {
  const { principalId: owner } = useWallet();
  const { stakedRewardsOGY } = useNeurons({ owner, limit: 0 });
  const { data: stakedRewardOGYUSD } = useFetchBalanceOGYUSD({
    balance: stakedRewardsOGY.totalStakedRewardsOGY,
  });

  return (
    <Card>
      <div className="flex justify-between mb-4">
        <div className="font-bold text-content/60">Staked Rewards</div>
      </div>
      <div className="flex items-center text-2xl font-semibold">
        <img className="h-6 w-6" src="/ogy_logo.svg" alt="OGY Logo" />
        <div className="flex ml-2">
          {stakedRewardsOGY.string.totalStakedRewardsOGY !== null ? (
            <div>
              {stakedRewardsOGY.string.totalStakedRewardsOGY}
              <span className="text-content/60 ml-2">OGY</span>
            </div>
          ) : (
            <Skeleton className="w-32" />
          )}
        </div>
      </div>
      <div className="flex">
        {stakedRewardOGYUSD !== null ? (
          <div className="text-content/60">{stakedRewardOGYUSD} USD</div>
        ) : (
          <Skeleton className="w-24" />
        )}
      </div>
      <div className="mt-4 xl:mt-8">
        <ClaimAllRewardsProvider
          neuronIds={stakedRewardsOGY.neuronIds}
          claimAmount={stakedRewardsOGY.totalStakedRewardsOGY as number}
        >
          <BtnClaimAllRewards />
          <DialogClaimAllRewards />
        </ClaimAllRewardsProvider>
      </div>
    </Card>
  );
};

export default StakedRewards;
