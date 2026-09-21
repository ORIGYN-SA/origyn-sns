import { ChartStatsCard } from "@components/dashboard";
import useFiveYearBooster from "@hooks/governance/useFiveYearBooster";
import { useLocale } from "@i18n/LocaleContext";

export const BOOSTER_HISTORY_ID = "five-year-booster-history";

const BoosterHistory = ({ className }: { className?: string }) => {
  const { t, locale } = useLocale();
  const { data, isPending, isError } = useFiveYearBooster();
  const dataChart = data?.rounds.map((round) => ({
    name: new Date(`${round.date}T00:00:00Z`).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    value: Number(round.amount) / 100_000_000,
  }));

  return (
    <ChartStatsCard
      className={className}
      title={t("governance.boosterHistory.title")}
      description={t("governance.boosterHistory.description")}
      stats={[
        {
          id: "booster-rate",
          label: t("governance.boosterHistory.rate"),
          tooltipContent: <p>{t("governance.boosterHistory.method")}</p>,
          value:
            data &&
            (data.rate == null
              ? t("common.notAvailable")
              : `+${data.rate.toLocaleString(locale, { maximumFractionDigits: 1 })}%`),
        },
        {
          id: "booster-paid",
          label: t("governance.boosterHistory.paid"),
          tooltipContent: <p>{t("governance.boosterHistory.paidTooltip")}</p>,
          value: data && (data.paid / 100_000_000n).toLocaleString(locale),
          unit: "OGY",
        },
      ]}
      chart={{
        data: dataChart,
        color: "#34d399",
        label: t("governance.boosterHistory.chartLabel"),
      }}
      legendLabel={t("governance.boosterHistory.chartLabel")}
      loading={isPending}
      isError={isError}
    />
  );
};

export default BoosterHistory;
