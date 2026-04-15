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

type Datum = { name: string; value: number };

type Props = {
  data: Datum[] | undefined;
  className?: string;
};

const chartConfig = {
  value: {
    label: "Total Supply",
    color: "#38bdf8",
  },
} satisfies ChartConfig;

const TotalSupplyAreaChart = ({ data = [], className }: Props) => {
  const values = data.map((d) => d.value);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;
  const pad = (maxValue - minValue) * 0.1;

  return (
    <ChartContainer config={chartConfig} className={className}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 12, left: 12, bottom: 0 }}
      >
        <defs>
          <linearGradient id="fill-total-supply" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-value)"
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor="var(--color-value)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
          width={48}
          domain={[Math.max(0, minValue - pad), maxValue + pad]}
          tickFormatter={(v: number) => (v >= 1000 ? millify(v) : String(v))}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent formatter={(v) => formatValue(v)} indicator="dot" />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill="url(#fill-total-supply)"
          activeDot={{ r: 4 }}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
};

export default TotalSupplyAreaChart;
