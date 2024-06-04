import { useEffect, useState } from "react";
import { Card, LoaderSpin, TooltipInfo, Button } from "@components/ui";
import useFetchBalanceOGY from "@hooks/accounts/useFetchBalanceOGY";
import { SNS_REWARDS_CANISTER_ID } from "@constants/index";

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
  const [data, setData] = useState<DataItem>({
    value: "0",
    token: "OGY",
    className: "bg-content",
  });

  const {
    data: balanceOGY,
    isLoading: isLoadingBalanceOGY,
    isError: isErrorBalanceOGY,
    isSuccess: isSuccessBalanceOGY,
  } = useFetchBalanceOGY({
    owner: SNS_REWARDS_CANISTER_ID,
    subaccount:
      "0100000000000000000000000000000000000000000000000000000000000000",
  });

  useEffect(() => {
    if (isSuccessBalanceOGY) {
      setData((prevData) => ({
        ...prevData,
        value: balanceOGY.string.balance,
      }));
    }
  }, [isSuccessBalanceOGY, balanceOGY]);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="text-lg font-semibold">ORIGYN Reward Account (ORA)</div>
      {isSuccessBalanceOGY && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card
            className="bg-surface-2/40 dark:bg-surface-2 mt-8 pb-8"
            key={data.token}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center text-lg font-semibold">
                <img src="/ogy_logo.svg" alt="OGY Logo" />
                <span className="ml-2 text-content/60">
                  ORA Balance ({data.token})
                </span>
              </div>
              <TooltipInfo id="tooltip-ora-ogy" clickable={true}>
                <p>
                  Token holders are able to stake their OGY and gain rewards by
                  participating in governance.
                </p>
                <p>
                  Rewards will come from the ORIGYN Reward Account, which ORIGYN
                  will seed with one billion OGY.
                </p>
                <p>
                  The reward pool consists of 250 million OGY in its first year
                  and will halve every two years to incentivize and reward early
                  and long-term contributors of the ecosystem.
                </p>
                <a
                  href="https://origyn.gitbook.io/origyn/tokenomics/staking-and-rewards"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="my-4 mx-auto w-full">More details</Button>
                </a>
              </TooltipInfo>
            </div>
            <div className="flex items-center mt-4 text-2xl font-semibold">
              <span className="mr-3">{data.value}</span>
              <span className="text-content/60">{data.token}</span>
            </div>
            <Card.BorderBottom className={`${data.className}`} />
          </Card>
        </div>
      )}
      {isLoadingBalanceOGY && (
        <div className="flex items-center justify-center h-40">
          <LoaderSpin />
        </div>
      )}
      {isErrorBalanceOGY && (
        <div className="flex items-center justify-center h-36 text-red-500 font-semibold">
          <div>Network error: Unable to fetch OGY reward account data</div>
        </div>
      )}
    </Card>
  );
};

export default OrigynTreasuryAccount;
