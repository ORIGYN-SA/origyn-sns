import useConnect from "@hooks/useConnect";
import { Card } from "@components/ui";
import {
  ClaimAllRewardsProvider,
  BtnClaimAllRewards,
  DialogClaimAllRewards,
} from "@pages/account/staked-rewards/claim-all-rewards";
import useNeurons from "@hooks/neurons/useNeuronsOwner";

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
        <span className="ml-2 mr-2">
          {stakedRewardsOGY.totalStakedRewardsOGY}
        </span>
        <span className="text-content/60">OGY</span>
      </div>
      <div className="mt-2 text-sm text-content/60">
        {stakedRewardsOGY.totalStakedRewardsOGYUSD} USD
      </div>
      <div className="mt-4 xl:mt-8">
        <ClaimAllRewardsProvider
          neuronIds={stakedRewardsOGY.neuronIds}
          claimAmount={stakedRewardsOGY.totalStakedRewardsOGY}
        >
          <BtnClaimAllRewards />
          <DialogClaimAllRewards />
        </ClaimAllRewardsProvider>
      </div>
    </Card>
  );
};

export default StakedRewards;
