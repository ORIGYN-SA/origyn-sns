import { useState, useEffect } from "react";
import { Card } from "@components/ui";
import StakeOGY from "./stake-ogy/StakeOGY";
import useFetchBalanceOGY from "@services/accounts/useFetchBalanceOGY";

const StakedOGY = () => {
  const [balanceOGY, setBalanceOGY] = useState(0);
  const [balanceOGYUSD, setBalanceOGYUSD] = useState("0");

  const { data: dataBalanceOGY, isSuccess: isSuccessFetchBalanceOGY } =
    useFetchBalanceOGY();

  useEffect(() => {
    if (isSuccessFetchBalanceOGY) {
      setBalanceOGY(dataBalanceOGY.balanceOGY);
      setBalanceOGYUSD(dataBalanceOGY.balanceOGYUSD);
    }
  }, [isSuccessFetchBalanceOGY, dataBalanceOGY]);

  return (
    <Card>
      <div className="flex justify-between mb-8">
        <div className="font-bold text-content/60">Staked OGY</div>
      </div>
      <div>
        <div></div>
        <div>
          <div>{balanceOGY} OGY</div>
          <div className="text-sm">{balanceOGYUSD} USD</div>
        </div>
      </div>
      <div className="mt-4 xl:mt-8">
        <StakeOGY />
      </div>
    </Card>
  );
};

export default StakedOGY;
