import useConnect from "@hooks/useConnect";
import { Card } from "@components/ui";
import {
  ClaimAllRewardsProvider,
  BtnClaimAllRewards,
  DialogClaimAllRewards,
} from "@pages/account/staked-rewards/claim-all-rewards";
import useNeurons from "@hooks/neurons/useNeuronsOwner";
import { Skeleton } from "@components/ui";

const StakedRewards = () => {
  const { principal: owner } = useConnect();
  const { stakedRewardsOGY } = useNeurons({ owner, limit: 0 });

  return (
    <Card>
      <div className="flex justify-between mb-4">
        <div className="font-bold text-content/60">Staked Rewards</div>
      </div>
      <div className="flex items-center text-2xl font-semibold">
        <img className="h-6 w-6" src="/ogy_logo.svg" alt="OGY Logo" />
        <div className="flex ml-2">
          {stakedRewardsOGY.totalStakedRewardsOGY !== null ? (
            <div>
              {stakedRewardsOGY.totalStakedRewardsOGY}
              <span className="text-content/60 ml-2">OGY</span>
            </div>
          ) : (
            <Skeleton className="w-32" />
          )}
        </div>
      </div>
      <div className="flex">
        {stakedRewardsOGY.totalStakedRewardsOGYUSD !== null ? (
          <div className="text-content/60">
            {stakedRewardsOGY.totalStakedRewardsOGYUSD} USD
          </div>
        ) : (
          <Skeleton className="w-16" />
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
