import { useState, useEffect } from "react";
import { Card } from "@components/ui";
import Transfer from "./transfer/Transfer";
import useFetchBalanceOGY from "@services/accounts/useFetchBalanceOGY";

const AvailableOGY = () => {
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
        <div className="font-bold text-content/60">Available OGY</div>
        <div>Transaction history</div>
      </div>
      <div>
        <div></div>
        <div>
          <div>{balanceOGY} OGY</div>
          <div className="text-sm">{balanceOGYUSD} USD</div>
        </div>
      </div>
      <div className="mt-8">
        <Transfer />
      </div>
    </Card>
  );
};

export default AvailableOGY;
