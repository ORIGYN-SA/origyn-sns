import { useState, useMemo } from "react";
import {
  PieChart,
  Cell,
  Label,
  Text,
  Pie as PieRechart,
  ResponsiveContainer,
} from "recharts";
import tc from "tinycolor2";
import { colors as themeColors } from "@theme/preset";
export interface PieChart {
  name: string;
  value: number;
  valueToString?: string;
}

const Pie = ({ data, colors }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const sumData = useMemo(
    () => data.reduce((acc, cur) => acc + cur.value, 0),
    [data]
  );

  const handleOnMouseOverCell = (index: number) => setActiveIndex(index);
  const handleOnMouseLeaveCell = () => setActiveIndex(null);

  return (
    <ResponsiveContainer>
      <PieChart>
        <PieRechart
          dataKey="value"
          data={data}
          innerRadius={80}
          outerRadius={140}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                activeIndex !== null && activeIndex !== index
                  ? tc(colors[activeIndex % colors.length]).setAlpha(0.5)
                  : colors[index % colors.length]
              }
              stroke={themeColors.surface.DEFAULT}
              strokeWidth={4}
              onMouseOver={() => handleOnMouseOverCell(index)}
              onMouseLeave={handleOnMouseLeaveCell}
            />
          ))}
          {activeIndex !== null && (
            <Label
              content={({ viewBox }) => {
                const commonPositioningProps = {
                  x: viewBox.cx,
                  y: viewBox.cy,
                  textAnchor: "middle",
                  verticalAnchor: "middle",
                };
                return (
                  <>
                    <Text
                      dy={-16}
                      fontSize={24}
                      fontWeight="bold"
                      fill={themeColors.content.DEFAULT}
                      {...commonPositioningProps}
                    >
                      {((data[activeIndex].value / sumData) * 100).toFixed(2)} %
                    </Text>

                    <Text
                      dy={32}
                      fill={themeColors.content.DEFAULT}
                      fontSize={12}
                      width={100}
                      {...commonPositioningProps}
                    >
                      {data[activeIndex].name}
                    </Text>
                  </>
                );
              }}
            />
          )}
        </PieRechart>
      </PieChart>
    </ResponsiveContainer>
  );
};

Pie.defaultProps = {
  data: [
    {
      name: "OGY not in the hand of the Foundation",
      value: 6957526202.66,
    },
    {
      name: "OGY locked in the hand of the Foundation",
      value: 6744999999.98,
    },
  ],
  colors: ["#645eff", "#333089"],
};

export default Pie;
