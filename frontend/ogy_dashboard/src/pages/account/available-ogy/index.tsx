import { useState, useEffect } from "react";
import { Card, Button } from "@components/ui";
import Transfer from "./transfer/Transfer";
import useFetchBalanceOGY from "@services/accounts/useFetchBalanceOGY";

const AvailableOGY = () => {
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
  };
  const [balanceOGY, setBalanceOGY] = useState(0);
  const [balanceOGYUSD, setBalanceOGYUSD] = useState("0");

  const { data: dataBalanceOGY, isSuccess: isSuccessFetchBalanceOGY } =
    useFetchBalanceOGY({});

  useEffect(() => {
    if (isSuccessFetchBalanceOGY) {
      setBalanceOGY(dataBalanceOGY.balanceOGY);
      setBalanceOGYUSD(dataBalanceOGY.balanceOGYUSD);
    }
  }, [isSuccessFetchBalanceOGY, dataBalanceOGY]);

  return (
    <Card>
      <div className="flex justify-between mb-4">
        <div className="font-bold text-content/60">Available OGY</div>
        <div>Transaction history</div>
      </div>
      <div>
        <div></div>
        <div>
          <div className="flex items-center text-2xl font-semibold">
            <img className="h-6 w-6" src="/ogy_logo.svg" alt="OGY Logo" />
            <span className="ml-2 mr-2">{balanceOGY}</span>
            <span className="text-content/60">OGY</span>
          </div>
          <div className="mt-2 text-sm text-content/60">
            {balanceOGYUSD} USD
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Button className="w-full" onClick={handleShow}>
          Transfer
        </Button>
        <Transfer show={show} handleClose={handleClose} />
      </div>
    </Card>
  );
};

export default AvailableOGY;
