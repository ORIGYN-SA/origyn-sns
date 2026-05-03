import { useState } from "react";
import { ChartStatsCard } from "@components/dashboard";
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

  return (
    <ChartStatsCard
      className={className}
      title="Users Overview"
      periodOptions={SELECT_PERIOD_OPTIONS}
      period={selectedPeriod}
      onPeriodChange={(v) => setSelectedPeriod(v as Period)}
      stats={[
        {
          id: "unique-token-holders",
          label: "OGY Protocol Users",
          tooltipContent: <p>Unique token holders of OGY tokens</p>,
          value: data?.[data.length - 1]?.total_unique_accounts.string,
        },
        {
          id: "active-users-account",
          label: "OGY Active Wallets",
          tooltipContent: <p>Active token holders of OGY tokens</p>,
          value:
            activeUsers &&
            roundAndFormatLocale({
              number: Number(activeUsers.active_accounts_count),
            }),
        },
      ]}
      chart={{
        data: (data ?? []).map(({ total_unique_accounts, start_time }) => ({
          name: start_time.datetime.toFormat("LLL dd"),
          value: total_unique_accounts.number,
        })),
        color: "#34d399",
        label: "OGY Protocol Users",
      }}
      legendLabel="OGY PROTOCOL USERS"
      loading={loading}
      isError={isError || isErrorFetchActiveUsers}
    />
  );
};

export default ChartUsersActivity;
