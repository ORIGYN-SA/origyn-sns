import {
  BarChart,
  Bar as BarRechart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { colors } from "@theme/preset";

type BarColor = {
  fill?: string;
  bgFill?: string;
};

type Bar = {
  barColor: BarColor;
  radius: number;
};

type Data = {
  name: string;
  value: number;
};

type BarChart = {
  data: Data[];
  barFill?: string;
  barBgFill?: string;
  barBgRadius?: number;
};

const Bar = ({ data, barFill, barBgFill, barBgRadius }: BarChart) => {
  return (
    <ResponsiveContainer>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 5,
          left: 5,
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="5 5" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, "dataMax + 500"]} />
        <Legend />
        <BarRechart
          dataKey="value"
          fill={barFill}
          background={{ fill: barBgFill, radius: barBgRadius }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

Bar.defaultProps = {
  data: [
    {
      name: "27 feb",
      value: 2000,
    },
    {
      name: "27 mar",
      value: 1500,
    },
    {
      name: "27 apr",
      value: 1200,
    },
    {
      name: "27 may",
      value: 1000,
    },
    {
      name: "27 jun",
      value: 850,
    },
    {
      name: "27 jul",
      value: 500,
    },
    {
      name: "27 aug",
      value: 200,
    },
  ],
  barFill: "#38bdf8",
  barBgFill: colors.surface["2"],
  barBgRadius: [50, 50, 0, 0],
};

export default Bar;
