import { useId } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart";
import { millify, formatValue } from "@helpers/numbers";
import { colors } from "@theme/preset";

type Datum = { name: string; value: number };

type Props = {
  data: Datum[] | undefined;
  color: string;
  label: string;
  className?: string;
};

const AreaChart = ({ data = [], color, label, className }: Props) => {
  const uid = useId().replace(/:/g, "");
  const gradientId = `area-fill-${uid}`;
  const dotShadowId = `dot-shadow-${uid}`;
  const values = data.map((d) => d.value);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const pad = (maxValue - minValue) * 0.1;

  const chartConfig = {
    value: { label, color },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className={className}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 12, left: 12, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-value)"
              stopOpacity={0.4}
            />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
          <filter
            id={dotShadowId}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="5"
              floodColor="black"
              floodOpacity="0.1"
            />
          </filter>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="rgb(var(--color-border-strong) / 0.5)"
        />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={60}
          domain={[Math.max(0, minValue - pad), maxValue + pad]}
          tickFormatter={(v: number) => (v >= 1000 ? millify(v) : String(v))}
        />
        <ChartTooltip
          cursor={{ stroke: colors.muted, strokeWidth: 2 }}
          content={
            <ChartTooltipContent
              formatter={(v) => formatValue(v)}
              indicator="dot"
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{
            r: 6,
            stroke: colors.surface[1],
            strokeWidth: 3,
            filter: `url(#${dotShadowId})`,
          }}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
};

export default AreaChart;
