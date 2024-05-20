import useConnect from "@hooks/useConnect";
import { Card } from "@components/ui";
import StakeOGY from "./stake-ogy/StakeOGY";
import useNeurons from "@hooks/neurons/useNeuronsOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";
import { Skeleton } from "@components/ui";

const StakedOGY = () => {
  const { principal: owner } = useConnect();
  const { stakedOGY } = useNeurons({ owner, limit: 0 });
  const { data: stakedOGYUSD } = useFetchBalanceOGYUSD({
    balance: stakedOGY.totalStakedOGY,
  });

  return (
    <Card>
      <div className="flex justify-between mb-4">
        <div className="font-bold text-content/60">Staked OGY</div>
      </div>
      <div className="flex items-center text-2xl font-semibold">
        <img className="h-6 w-6" src="/ogy_logo.svg" alt="OGY Logo" />
        <div className="flex ml-2">
          {stakedOGY.string.totalStakedOGY !== null ? (
            <div>
              {stakedOGY.string.totalStakedOGY}
              <span className="text-content/60 ml-2">OGY</span>
            </div>
          ) : (
            <Skeleton className="w-32" />
          )}
        </div>
      </div>
      <div className="flex">
        {stakedOGYUSD !== null ? (
          <div className="text-content/60">{stakedOGYUSD} USD</div>
        ) : (
          <Skeleton className="w-24" />
        )}
      </div>

      <div className="mt-8 xl:mt-8">
        <StakeOGY />
      </div>
    </Card>
  );
};

export default StakedOGY;
