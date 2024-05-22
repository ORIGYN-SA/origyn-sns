import {
  AreaChart,
  ResponsiveContainer,
  Area as AreaRechart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Data = {
  name: string;
  value: number;
};

type AreaChart = {
  data: Data[];
  fill?: string;
};

const Area = ({ data, fill }: AreaChart) => {
  return (
    <ResponsiveContainer>
      <AreaChart
        width={500}
        height={400}
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id={`fill${fill}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fill} stopOpacity={0.8} />
            <stop offset="95%" stopColor={fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="5 5" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, "dataMax + 500"]} />
        <Tooltip />
        <AreaRechart
          type="monotone"
          dataKey="value"
          stroke={fill}
          strokeWidth={4}
          fillOpacity={1}
          fill={`url(#fill${fill})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

Area.defaultProps = {
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
  fill: "#00A2F7",
};

export default Area;
