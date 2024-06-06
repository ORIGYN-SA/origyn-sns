import { useState } from "react";
import { Link } from "react-router-dom";
import useConnect from "@hooks/useConnect";
import { Card, Button } from "@components/ui";
import Transfer from "./transfer/Transfer";
import useFetchBalanceOGYOwner from "@hooks/accounts/useFetchBalanceOGYOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";
import { Skeleton } from "@components/ui";

const AvailableOGY = () => {
  const { principal } = useConnect();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
  };

  const { data: balanceOGY } = useFetchBalanceOGYOwner();
  const { data: balanceOGYUSD } = useFetchBalanceOGYUSD({
    balance: balanceOGY?.balance,
  });
  console.log("test husky ");

  return (
    <Card>
      <div className="flex justify-between mb-4">
        <div className="font-bold text-content/60">Available OGY</div>
        <Link
          className="font-semibold text-accent hover:underline"
          to={`/explorer/transactions/accounts/${principal}`}
        >
          Transaction history
        </Link>
      </div>
      <div>
        <div></div>
        <div>
          <div className="flex items-center text-2xl font-semibold">
            <img className="h-6 w-6" src="/ogy_logo.svg" alt="OGY Logo" />
            <div className="flex ml-2">
              {balanceOGY?.balance !== undefined ? (
                <div>
                  {balanceOGY.balance}
                  <span className="text-content/60 ml-2">OGY</span>
                </div>
              ) : (
                <Skeleton className="w-32" />
              )}
            </div>
          </div>
          <div className="flex">
            {balanceOGYUSD ? (
              <div className="text-content/60">{balanceOGYUSD} USD</div>
            ) : (
              <Skeleton className="w-24" />
            )}
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
