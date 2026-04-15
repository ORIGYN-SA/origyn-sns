import { ReactNode, useEffect, useState } from "react";
import { Card, LoaderSpin, TooltipInfo } from "@components/ui";
import { StatCard } from "@components/dashboard";
import useFetchTreasuryAccountICP from "@hooks/accounts/useFetchTreasuryAccountICP";
import useFetchTreasuryAccountOGY from "@hooks/accounts/useFetchTreasuryAccountOGY";

interface DataItem {
  value: string;
  token: string;
  logo: string;
  className: string;
  tooltip: {
    id: string;
    content: ReactNode;
  };
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
      logo: "/ogy_logo.svg",
      className: "bg-purple-500",
      tooltip: {
        id: "tooltip-ota-ogy",
        content: (
          <>
            <p>
              Network Utility Revenue generated through fees for utilizing the
              ORIGYN network (e.g., for issuing or transferring digital
              certificates, minting NFTs, etc.) and accumulated in OGY.
            </p>
          </>
        ),
      },
    },
    {
      value: "0",
      token: "ICP",
      logo: "/icp_logo.svg",
      className: "bg-pink-500",
      tooltip: {
        id: "tooltip-ota-icp",
        content: (
          <>
            <p>
              Network Utility Revenue generated through fees for utilizing the
              ORIGYN network (e.g., for issuing or transferring digital
              certificates, minting NFTs, etc.) and accumulated in ICP.
            </p>
          </>
        ),
      },
    },
  ]);

  const {
    data: balanceICP,
    isLoading: isLoadingBalanceICP,
    isError: isErrorBalanceICP,
    isSuccess: isSuccessBalanceICP,
  } = useFetchTreasuryAccountICP();

  // const {
  //   data: balanceOGY,
  //   isLoading: isLoadingBalanceOGY,
  //   isError: isErrorBalanceOGY,
  //   isSuccess: isSuccessBalanceOGY,
  // } = useFetchTreasuryAccountOGY({
  //   owner: SNS_GOVERNANCE_CANISTER_ID,
  //   subaccount: ACCOUNT_ID_LEDGER_OGY,
  // });
  const {
    data: balanceOGY,
    isLoading: isLoadingBalanceOGY,
    isError: isErrorBalanceOGY,
    isSuccess: isSuccessBalanceOGY,
  } = useFetchTreasuryAccountOGY();

  useEffect(() => {
    if (isSuccessBalanceICP && isSuccessBalanceOGY) {
      setData((prevData) =>
        prevData.map((item) => {
          if (item.token === "OGY") {
            // TODO hardcode value before swap complete
            return { ...item, value: "99,661,463.92" as string };
          } else if (item.token === "ICP") {
            return { ...item, value: balanceICP as string };
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-8">
          {data.map(({ value, token, className, logo, tooltip }) => (
            <StatCard
              key={token}
              title={`Network Revenue (${token})`}
              value={value}
              unit={token}
              accessory={
                <img src={logo} height={32} width={32} alt="Token logo" />
              }
              tooltip={
                <TooltipInfo id={tooltip.id}>{tooltip.content}</TooltipInfo>
              }
              underlineClassName={className}
            />
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
