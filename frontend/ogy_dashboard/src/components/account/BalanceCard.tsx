import { ReactNode } from "react";
import { Card } from "@components/ui";
import { Stat } from "@components/dashboard";

type BalanceCardProps = {
  title: string;
  headerAction?: ReactNode;
  balance?: ReactNode;
  isBalanceLoading?: boolean;
  usd?: string;
  isUsdLoading?: boolean;
  isUsdError?: boolean;
  action: ReactNode;
};

const BalanceCard = ({
  title,
  headerAction,
  balance,
  isBalanceLoading = false,
  usd,
  isUsdLoading = false,
  isUsdError = false,
  action,
}: BalanceCardProps) => {
  return (
    <Card className="!rounded-2xl !border-border-strong flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between gap-4">
        <div className="font-bold text-base leading-none text-muted">
          {title}
        </div>
        {headerAction}
      </div>
      <div className="flex flex-col gap-1">
        <Stat
          iconSrc="/ogy_logo.svg"
          value={balance}
          unit="OGY"
          loading={isBalanceLoading}
        />
        <div className="flex h-[20px] items-center font-sans text-[14px] leading-none text-muted">
          {isUsdLoading ? (
            <div
              data-skel-block
              className="h-4 w-24 rounded-md bg-muted/20 animate-pulse"
            />
          ) : (
            <span>
              Value: {isUsdError || usd === undefined ? "--" : `${usd} USD`}
            </span>
          )}
        </div>
      </div>
      <div>{action}</div>
    </Card>
  );
};

export default BalanceCard;
