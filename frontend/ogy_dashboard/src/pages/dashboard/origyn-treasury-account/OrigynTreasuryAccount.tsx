import { useEffect, useState } from "react";
import { Card, LoaderSpin } from "@components/ui";
import useFetchBalanceICP from "@hooks/accounts/useFetchBalanceICP";
import useFetchBalanceOGY from "@hooks/accounts/useFetchBalanceOGY";
import {
  SNS_GOVERNANCE_CANISTER_ID,
  ACCOUNT_ID_LEDGER_OGY,
} from "@constants/index";

interface DataItem {
  value: string;
  token: string;
  className: string;
}

type OrigynTreasuryAccount = {
  className?: string;
};

const OrigynTreasuryAccount = ({
  className,
  ...restProps
}: OrigynTreasuryAccount) => {
  const [data, setData] = useState<DataItem[]>([
    {
      value: "0",
      token: "OGY",
      className: "bg-purple-500",
    },
    {
      value: "0",
      token: "ICP",
      className: "bg-pink-500",
    },
  ]);

  const {
    data: balanceICP,
    isLoading: isLoadingBalanceICP,
    isError: isErrorBalanceICP,
    isSuccess: isSuccessBalanceICP,
  } = useFetchBalanceICP();
  const {
    data: balanceOGY,
    isLoading: isLoadingBalanceOGY,
    isError: isErrorBalanceOGY,
    isSuccess: isSuccessBalanceOGY,
  } = useFetchBalanceOGY({
    owner: SNS_GOVERNANCE_CANISTER_ID,
    subaccount: ACCOUNT_ID_LEDGER_OGY,
  });

  useEffect(() => {
    if (isSuccessBalanceICP && isSuccessBalanceOGY) {
      setData((prevData) =>
        prevData.map((item) => {
          if (item.token === "OGY") {
            return { ...item, value: balanceOGY.string.balance };
          } else if (item.token === "ICP") {
            return { ...item, value: balanceICP.string.balance };
          }
          return item;
        })
      );
    }
  }, [isSuccessBalanceICP, isSuccessBalanceOGY, balanceICP, balanceOGY]);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="text-lg font-semibold">ORIGYN Treasury Account (OTA)</div>
      {isSuccessBalanceICP && isSuccessBalanceOGY && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {data.map(({ value, token, className }) => (
            <Card className="bg-surface-2 mt-8 pb-8" key={token}>
              <div className="flex items-center text-lg font-semibold">
                <img src="/ogy_logo.svg" alt="OGY Logo" />
                <span className="ml-2 text-content/60">
                  Network Revenue ({token})
                </span>
              </div>
              <div className="flex items-center mt-4 text-2xl font-semibold">
                <span className="mr-3">{value}</span>
                <span className="text-content/60">{token}</span>
              </div>
              <Card.BorderBottom className={`${className}`} />
            </Card>
          ))}
        </div>
      )}
      {(isLoadingBalanceICP || isLoadingBalanceOGY) && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin />
        </div>
      )}
      {(isErrorBalanceICP || isErrorBalanceOGY) && (
        <div className="flex items-center justify-center h-36 text-red-500 font-semibold">
          <div>Network error: Unable to fetch OGY treasury account data</div>
        </div>
      )}
    </Card>
  );
};

export default OrigynTreasuryAccount;
