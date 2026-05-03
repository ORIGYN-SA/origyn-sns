import { useId } from "react";
import Tooltip from "@components/Tooltip/Tooltip";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactNumber } from "@/hooks/tokenMetricsUtils";
import styles from "./TimeSeriesChart.module.scss";

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={styles.infoIcon}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

const ChartTooltip = ({ active, label, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipLabel}>{label}</p>
      <p className={styles.chartTooltipValue}>
        {Number(payload[0].value).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        })}{" "}
        OGY
      </p>
    </div>
  );
};

const DEFAULT_Y_DOMAIN = [0, "auto"];

const getYAxisDomain = (chartData) => {
  const values = chartData
    .map((entry) => entry?.value)
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return DEFAULT_Y_DOMAIN;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue;
  const padding = range > 0 ? range * 0.1 : Math.max(Math.abs(maxValue) * 0.05, 1);

  return [Math.max(0, minValue - padding), maxValue + padding];
};

const TimeSeriesChart = ({
  title,
  headerTooltip,
  totalLabel,
  totalValue,
  chartData,
  fill,
  loading,
  error,
  periodOptions,
  selectedPeriod,
  onPeriodChange,
}) => {
  const gradientId = useId().replace(/:/g, "");
  const hasData = !loading && !error && Array.isArray(chartData) && chartData.length > 0;
  const yAxisDomain = hasData ? getYAxisDomain(chartData) : DEFAULT_Y_DOMAIN;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.title}>{title}</span>
          <span className={styles.infoIconWrapper} data-tooltip-id={headerTooltip.id}>
            <InfoIcon />
          </span>
          <Tooltip
            id={headerTooltip.id}
            clickable={headerTooltip.clickable ?? false}
            className={styles.tooltip}
          >
            {headerTooltip.content}
          </Tooltip>
        </div>

        <label className={styles.selectWrapper}>
          <select
            className={styles.select}
            value={selectedPeriod}
            onChange={(event) => onPeriodChange(event.target.value)}
            aria-label={`${title} period`}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className={styles.selectCaret} aria-hidden="true" />
        </label>
      </div>

      <div className={styles.totalSection}>
        <p className={styles.totalLabel}>{totalLabel}</p>
        <div className={styles.totalValue}>
          {totalValue ? (
            <>
              <img src="/ogy_logo.svg" alt="OGY Logo" />
              <span className={styles.totalNumber}>{totalValue}</span>
              <span className={styles.totalUnit}>OGY</span>
            </>
          ) : (
            <div className={styles.skeleton} />
          )}
        </div>
      </div>

      <div className={styles.chartContainer}>
        {hasData && (
          <ResponsiveContainer width="100%" height="100%">
            <RechartsAreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 25,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={fill} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={fill} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={true}
                horizontal={false}
                strokeDasharray="5 5"
                stroke="rgba(34, 37, 38, 0.08)"
              />

              <XAxis
                dataKey="name"
                tick={false}
                tickLine={false}
                axisLine={false}
                height={8}
              />

              <YAxis
                tickFormatter={formatCompactNumber}
                tickLine={false}
                axisLine={false}
                domain={yAxisDomain}
                width={64}
                tick={{ fill: "rgba(34, 37, 38, 0.55)", fontSize: 12 }}
              />

              <RechartsTooltip content={<ChartTooltip />} />

              <Area
                type="monotone"
                dataKey="value"
                stroke={fill}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 4, fill }}
                dot={false}
              />
            </RechartsAreaChart>
          </ResponsiveContainer>
        )}

        {loading && (
          <div className={styles.loaderWrapper}>
            <div className={styles.spinner} />
          </div>
        )}

        {!loading && error && (
          <div className={styles.stateMessage}>
            <p>Unable to load this token metric right now.</p>
          </div>
        )}

        {!loading && !error && !hasData && (
          <div className={styles.stateMessage}>
            <p>No chart data available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSeriesChart;
