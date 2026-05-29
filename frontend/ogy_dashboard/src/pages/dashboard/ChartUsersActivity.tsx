import { useState } from "react";
import { ChartStatsCard } from "@components/dashboard";
import useGetActivityStats, {
  Period,
} from "@hooks/super_stats_v3/useGetActivityStats";
import useGetActiveUsersCount from "@hooks/token_metrics/useGetActiveUsersCount";
import { roundAndFormatLocale } from "@helpers/numbers";
import { useT } from "@i18n/LocaleContext";

const ChartUsersActivity = ({ className }: { className?: string }) => {
  const t = useT();
  const selectPeriodOptions: { value: Period; label: string }[] = [
    { value: "monthly", label: t("charts.period.monthly") },
    { value: "yearly", label: t("charts.period.yearly") },
    { value: "all", label: t("charts.period.all") },
  ];
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
      title={t("charts.usersActivity.title")}
      periodOptions={selectPeriodOptions}
      period={selectedPeriod}
      onPeriodChange={(v) => setSelectedPeriod(v as Period)}
      stats={[
        {
          id: "unique-token-holders",
          label: t("charts.usersActivity.protocolUsers"),
          tooltipContent: <p>{t("charts.usersActivity.protocolUsersTooltip")}</p>,
          value: data?.[data.length - 1]?.total_unique_accounts.string,
        },
        {
          id: "active-users-account",
          label: t("charts.usersActivity.activeWallets"),
          tooltipContent: <p>{t("charts.usersActivity.activeWalletsTooltip")}</p>,
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
        label: t("charts.usersActivity.protocolUsers"),
      }}
      legendLabel={t("charts.usersActivity.protocolUsersLegend")}
      loading={loading}
      isError={isError || isErrorFetchActiveUsers}
    />
  );
};

export default ChartUsersActivity;
