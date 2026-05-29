import { useWallet } from "@components/auth/useWallet";
import BalanceCard from "@components/account/BalanceCard";
import StakeOGY from "./stake-ogy/StakeOGY";
import useNeurons from "@hooks/neurons/useNeuronsOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";
import { useT } from "@i18n/LocaleContext";

const StakedOGY = () => {
  const t = useT();
  const { principalId: owner } = useWallet();
  const { stakedOGY } = useNeurons({ owner, limit: 0 });
  const {
    data: stakedOGYUSD,
    isLoading: isStakedUsdLoading,
    isError: isStakedUsdError,
  } = useFetchBalanceOGYUSD({ balance: stakedOGY.totalStakedOGY });

  const isBalanceLoading = stakedOGY.string.totalStakedOGY === null;
  const isUsdLoading = isBalanceLoading || isStakedUsdLoading;

  return (
    <BalanceCard
      title={t("account.staked.title")}
      balance={stakedOGY.string.totalStakedOGY ?? undefined}
      isBalanceLoading={isBalanceLoading}
      usd={stakedOGYUSD}
      isUsdLoading={isUsdLoading}
      isUsdError={isStakedUsdError}
      action={<StakeOGY />}
    />
  );
};

export default StakedOGY;
