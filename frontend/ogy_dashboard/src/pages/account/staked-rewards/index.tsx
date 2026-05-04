import { useWallet } from "@components/auth/useWallet";
import BalanceCard from "@components/account/BalanceCard";
import {
  ClaimAllRewardsProvider,
  BtnClaimAllRewards,
  DialogClaimAllRewards,
} from "@pages/account/staked-rewards/claim-all-rewards";
import useNeurons from "@hooks/neurons/useNeuronsOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";

const StakedRewards = () => {
  const { principalId: owner } = useWallet();
  const { stakedRewardsOGY } = useNeurons({ owner, limit: 0 });
  const {
    data: stakedRewardOGYUSD,
    isLoading: isRewardsUsdLoading,
    isError: isRewardsUsdError,
  } = useFetchBalanceOGYUSD({
    balance: stakedRewardsOGY.totalStakedRewardsOGY,
  });

  const isBalanceLoading =
    stakedRewardsOGY.string.totalStakedRewardsOGY === null;
  const isUsdLoading = isBalanceLoading || isRewardsUsdLoading;

  return (
    <BalanceCard
      title="Staked Rewards"
      balance={stakedRewardsOGY.string.totalStakedRewardsOGY ?? undefined}
      isBalanceLoading={isBalanceLoading}
      usd={stakedRewardOGYUSD}
      isUsdLoading={isUsdLoading}
      isUsdError={isRewardsUsdError}
      action={
        <ClaimAllRewardsProvider
          neuronIds={stakedRewardsOGY.neuronIds}
          claimAmount={stakedRewardsOGY.totalStakedRewardsOGY as number}
        >
          <BtnClaimAllRewards />
          <DialogClaimAllRewards />
        </ClaimAllRewardsProvider>
      }
    />
  );
};

export default StakedRewards;
