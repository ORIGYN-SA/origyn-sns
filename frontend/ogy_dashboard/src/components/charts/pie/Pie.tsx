// src/components/charts/pie/Pie.tsx
import React, { useMemo } from "react";
import {
  PieChart as RechartsPieChart,
  Cell,
  Label,
  Text,
  Pie as RechartsPie,
  ResponsiveContainer,
  LabelProps,
} from "recharts";
import tc from "tinycolor2";
import { colors as themeColors } from "@theme/preset";
import { usePieChart } from "./context";
import { PolarViewBox } from "recharts/types/util/types";

export interface PieChartData {
  name: string;
  value: number;
  valueToString?: string;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  colors: string[];
}

const PieChart: React.FC<PieChartProps> = ({ data, colors }) => {
  const { activeIndex, setActiveIndex } = usePieChart();

  const validData = useMemo(
    () => data.filter((d) => typeof d.value === "number" && !isNaN(d.value)),
    [data]
  );

  const sumData = useMemo(
    () => validData.reduce((acc, cur) => acc + cur.value, 0),
    [validData]
  );

  const isActiveIndexValid =
    activeIndex !== null && activeIndex >= 0 && activeIndex < validData.length;

  const handleOnMouseOverCell = (index: number) => {
    if (index >= 0 && index < validData.length) {
      setActiveIndex(index);
    }
  };

  const handleOnMouseLeaveCell = () => setActiveIndex(null);

  return (
    <ResponsiveContainer>
      <RechartsPieChart>
        <RechartsPie
          dataKey="value"
          data={validData}
          innerRadius={80}
          outerRadius={140}
        >
          {validData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                isActiveIndexValid && activeIndex !== index
                  ? tc(colors[activeIndex % colors.length])
                      .setAlpha(0.5)
                      .toString()
                  : colors[index % colors.length]
              }
              stroke={themeColors.surface.DEFAULT}
              strokeWidth={4}
              onMouseOver={() => handleOnMouseOverCell(index)}
              onMouseLeave={handleOnMouseLeaveCell}
            />
          ))}
          {isActiveIndexValid && (
            <Label
              content={(props: LabelProps) => {
                if (
                  !props.viewBox ||
                  typeof (props.viewBox as PolarViewBox).cx !== "number" ||
                  typeof (props.viewBox as PolarViewBox).cy !== "number"
                ) {
                  return null;
                }
                const viewBox = props.viewBox as PolarViewBox;
                const { cx, cy } = viewBox;
                const activeData = validData[activeIndex];
                return (
                  <>
                    <Text
                      dy={-16}
                      fontSize={24}
                      fontWeight="bold"
                      fill={themeColors.content}
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      verticalAnchor="middle"
                    >
                      {((activeData.value / sumData) * 100).toFixed(1) + " %"}
                    </Text>
                    <Text
                      dy={24}
                      fill={themeColors.content}
                      fontSize={12}
                      width={100}
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      verticalAnchor="middle"
                    >
                      {activeData.name}
                    </Text>
                  </>
                );
              }}
            />
          )}
        </RechartsPie>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};

PieChart.defaultProps = {
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

export default PieChart;
