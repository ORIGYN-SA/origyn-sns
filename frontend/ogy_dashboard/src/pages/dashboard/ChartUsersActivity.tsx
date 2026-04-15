import { useState } from "react";
import { Card, TooltipInfo } from "@components/ui";
import Skeleton from "@components/ui/SkeletonShadcn";
import { PeriodSelect } from "@components/dashboard";
import { Error as ChartError } from "@components/charts";
import AreaChart from "@components/charts/shadcn/AreaChart";
import useGetActivityStats, {
  Period,
} from "@hooks/super_stats_v3/useGetActivityStats";
import useGetActiveUsersCount from "@hooks/token_metrics/useGetActiveUsersCount";
import { roundAndFormatLocale } from "@helpers/numbers";

const SELECT_PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "all", label: "All" },
];

const ChartUsersActivity = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("monthly");

  const { data, isLoading, isError } = useGetActivityStats({
    period: selectedPeriod,
  });

  const {
    data: activeUsers,
    isLoading: isLoadingFetchActiveUsers,
    isError: isErrorFetchActiveUsers,
  } = useGetActiveUsersCount();

  const loading = isLoading || isLoadingFetchActiveUsers;

  const handleOnChangePeriod = (value: string) => {
    setSelectedPeriod(value as Period);
  };

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-2">Users Overview</h2>
        </div>
        <PeriodSelect
          options={SELECT_PERIOD_OPTIONS}
          value={selectedPeriod}
          onChange={handleOnChangePeriod}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-4">
        <div className="col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex">
              <span className="text-content/60 font-semibold mr-2">
                OGY Protocol Users
              </span>
              <TooltipInfo id="tooltip-unique-token-holders">
                <p>Unique token holders of OGY tokens</p>
              </TooltipInfo>
            </div>
            <div className="text-2xl font-semibold mt-2 mb-4 xl:mb-0">
              {loading ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                data?.[data.length - 1]?.total_unique_accounts.string
              )}
            </div>

            <div className="flex mt-6">
              <span className="text-content/60 font-semibold mr-2">
                OGY Active Wallets
              </span>
              <TooltipInfo id="tooltip-active-users-account">
                <p>Active token holders of OGY tokens</p>
              </TooltipInfo>
            </div>
            <div className="text-2xl font-semibold mt-2 mb-12 xl:mb-0">
              {loading ? (
                <Skeleton className="h-7 w-32" />
              ) : (
                activeUsers &&
                roundAndFormatLocale({
                  number: Number(activeUsers.active_accounts_count),
                })
              )}
            </div>
          </div>

          <div className="xl:flex items-center mb-6 hidden">
            <div className="h-2 w-4 rounded-lg bg-[#34d399]"></div>
            <div className="text-xs text-content/60 font-semibold ml-2">
              OGY PROTOCOL USERS
            </div>
          </div>
        </div>
        <div className="col-span-3 h-72 rounded-xl">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <AreaChart
              data={(data ?? []).map(
                ({ total_unique_accounts, start_time }) => ({
                  name: start_time.datetime.toFormat("LLL dd"),
                  value: total_unique_accounts.number,
                })
              )}
              color="#34d399"
              label="OGY Protocol Users"
              className="h-full w-full"
            />
          )}
        </div>
        <div className="flex items-center justify-end mt-2 mr-6 xl:hidden">
          <div className="h-2 w-4 rounded-lg bg-[#34d399]"></div>
          <div className="text-xs text-content/60 font-semibold ml-2">
            OGY PROTOCOL USERS
          </div>
        </div>
      </div>
      {(isError || isErrorFetchActiveUsers) && (
        <ChartError>Error while fetching users account data.</ChartError>
      )}
    </Card>
  );
};

export default ChartUsersActivity;
