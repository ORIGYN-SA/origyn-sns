import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  type RectangleProps,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@components/charts/shadcn/chart";
import useEstimatedRewards from "@hooks/governance/useEstimatedRewards";
import useFiveYearBooster from "@hooks/governance/useFiveYearBooster";
import { useLocale } from "@i18n/LocaleContext";

const BASE_COLOR = "rgb(var(--color-muted) / 0.35)";
const BOOSTER_COLOR = "#34d399";
const PLACEHOLDER_RATES = [2.9, 3.6, 4.4, 5.1, 5.9];

// Recharts types shape props as unknown; each rect carries its datum's fields.
// Only round the base segment when no booster is stacked on it.
const renderBaseSegment = (props: unknown) => {
  const rect = props as RectangleProps & { booster: number | null };
  return (
    <Rectangle {...rect} radius={rect.booster == null ? [6, 6, 0, 0] : 0} />
  );
};

const ApyByLockDuration = ({ className }: { className?: string }) => {
  const { t, locale } = useLocale();
  const rewards = useEstimatedRewards();
  const booster = useFiveYearBooster();

  const loading = rewards.isLoading || booster.isPending;
  const hasError = !rewards.isLoading && rewards.isError;
  const boosterRate = booster.data?.rate ?? null;

  const formatRate = (rate: number) =>
    `${rate.toLocaleString(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;

  const baseRates =
    rewards.data?.map((reward) => reward.ratePercent) ?? PLACEHOLDER_RATES;
  const data = baseRates.map((base, index) => {
    const years = index + 1;
    // Null (not 0) keeps the empty booster segment out of the tooltip.
    const bonus = years === 5 ? boosterRate : null;
    return {
      name: `${years} ${years === 1 ? t("governance.estimateRewards.year") : t("governance.estimateRewards.years")}`,
      base,
      booster: bonus,
      baseLabel: bonus == null ? formatRate(base) : null,
      totalLabel: bonus == null ? null : formatRate(base + bonus),
    };
  });

  const chartConfig = {
    base: {
      label: t("governance.apyByLock.base"),
      color: BASE_COLOR,
    },
    booster: {
      label: t("governance.apyByLock.booster"),
      color: BOOSTER_COLOR,
    },
  } satisfies ChartConfig;

  return (
    <SkeletonOverlay loading={loading || hasError}>
      <Card className={className}>
        <div data-skel-static>
          <h2 className="text-content text-[22px] font-semibold leading-tight">
            {t("governance.apyByLock.title")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            {t("governance.apyByLock.description")}
          </p>
        </div>

        <div data-skel-block className="mt-6 h-72 rounded-xl xl:h-[360px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={data}
              margin={{ top: 28, right: 12, left: 12, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="rgb(var(--color-border-strong) / 0.5)"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v: number) => `${v}%`}
              />
              <ChartTooltip
                cursor={{ fill: "rgb(var(--color-muted) / 0.08)" }}
                content={
                  <ChartTooltipContent formatter={formatRate} indicator="dot" />
                }
              />
              <Bar
                dataKey="base"
                stackId="apy"
                fill="var(--color-base)"
                maxBarSize={72}
                shape={renderBaseSegment}
              >
                <LabelList
                  dataKey="baseLabel"
                  position="top"
                  className="fill-content text-xs font-semibold"
                />
              </Bar>
              <Bar
                dataKey="booster"
                stackId="apy"
                fill="var(--color-booster)"
                radius={[6, 6, 0, 0]}
                maxBarSize={72}
              >
                <LabelList
                  dataKey="totalLabel"
                  position="top"
                  className="fill-content text-sm font-bold"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-4 pe-2">
          {(["base", "booster"] as const).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: chartConfig[key].color }}
              />
              <div className="text-xs font-semibold text-content/60">
                {chartConfig[key].label}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-5 text-muted">
          {boosterRate == null && !booster.isPending
            ? t("governance.estimateRewards.boosterUnavailable")
            : t("governance.apyByLock.footnote")}
        </p>
        {hasError && <CardErrorOverlay title={t("governance.apyByLock.title")} />}
      </Card>
    </SkeletonOverlay>
  );
};

export default ApyByLockDuration;
