import { useState } from "react";
import { Card, Button } from "@components/ui";
import Transfer from "./transfer/Transfer";
import useFetchBalanceOGY from "@services/queries/accounts/useFetchBalanceOGY";
import { Skeleton } from "@components/ui";

const AvailableOGY = () => {
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
  };

  const { data: dataBalanceOGY } = useFetchBalanceOGY({});

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
            <div className="flex ml-2">
              {dataBalanceOGY?.balanceOGY !== undefined ? (
                <div>
                  {dataBalanceOGY.balanceOGY}
                  <span className="text-content/60 ml-2">OGY</span>
                </div>
              ) : (
                <Skeleton className="w-32" />
              )}
            </div>
          </div>
          <div className="mt-2 text-sm">
            <div className="flex">
              {dataBalanceOGY?.balanceOGYUSD ? (
                <div className="text-content/60">
                  {dataBalanceOGY.balanceOGYUSD} USD
                </div>
              ) : (
                <Skeleton className="w-16" />
              )}
            </div>
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
