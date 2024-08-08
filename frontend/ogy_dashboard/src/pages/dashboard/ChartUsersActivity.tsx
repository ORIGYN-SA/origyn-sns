import { useMemo } from "react";
import { Card, TooltipInfo } from "@components/ui";
import {
  Loader as ChartLoader,
  Error as ChartError,
  Area as ChartArea
} from "@components/charts";
import useGetActivityStats from "@hooks/super_stats_v3/useGetActivityStats";
import useGetActiveUsersCount from "@hooks/token_metrics/useGetActiveUsersCount";
import { roundAndFormatLocale } from "@helpers/numbers";

const ChartUsersActivity = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const barFill = useMemo(() => "#34d399", []);

  // TODO implement change period (dayly/weekly/monthly...)
  const { data, isLoading, isSuccess, isError } = useGetActivityStats({});
  const {
    data: activeUsers,
    isLoading: isLoadingFetchActiveUsers,
    isSuccess: isSuccessFetchActiveUsers,
    isError: isErrorFetchActiveUsers,
  } = useGetActiveUsersCount();

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-2">Users Overview</h2>
        </div>
        {isSuccess && isSuccessFetchActiveUsers && (
          <button className="text-sm font-medium rounded-full px-3 py-1">
            Monthly
          </button>
        )}
      </div>
      {(isLoading || isLoadingFetchActiveUsers) && <ChartLoader />}
      {isSuccess && isSuccessFetchActiveUsers && data && activeUsers && (
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
                {data[data.length - 1].total_unique_accounts.string}
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
                {roundAndFormatLocale({
                  number: Number(activeUsers.active_accounts_count),
                })}
              </div>
            </div>

            <div className="xl:flex items-center mb-6 hidden">
              <div className={`h-2 w-4 bg-[${barFill}] mr-2 rounded-lg`}></div>
              <div className="text-xs text-content/60 font-semibold">
                OGY PROTOCOL USERS
              </div>
            </div>
          </div>
          <div className="col-span-3 h-72 rounded-xl">
            <ChartArea
              data={data.map(({ total_unique_accounts, start_time }) => {
                return {
                  name: start_time.datetime.toFormat("LLL dd"),
                  value: total_unique_accounts.number
                };
              })}
              fill={barFill}
            />
          </div>
          <div className="flex items-center justify-end mt-2 mr-6 xl:hidden">
            <div className={`h-2 w-4 bg-[${barFill}] mr-2 rounded-lg`}></div>
            <div className="text-xs text-content/60 font-semibold">
              OGY PROTOCOL USERS
            </div>
          </div>
        </div>
      )}
      {(isError || isErrorFetchActiveUsers) && (
        <ChartError>Error while fetching users account data.</ChartError>
      )}
    </Card>
  );
};

export default ChartUsersActivity;
