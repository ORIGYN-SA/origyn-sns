import React, { useMemo } from "react";
import {
  PieChart as RechartsPieChart,
  Cell,
  Label,
  Text,
  Pie as RechartsPie,
  LabelProps,
} from "recharts";
import { PolarViewBox } from "recharts/types/util/types";
import { colors as themeColors } from "../../tailwind-preset";
import { ChartContainer } from "./chart";
import { usePieChart } from "./context";

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
const PieChart: React.FC<PieChartProps> = ({
  data = [],
  colors = ["#645eff", "#333089"],
}) => {
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
    <ChartContainer config={{}} className="h-full w-full aspect-auto">
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
              fill={colors[index % colors.length]}
              fillOpacity={
                isActiveIndexValid && activeIndex !== index ? 0.5 : 1
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
                      {parseFloat(
                        ((activeData.value / sumData) * 100).toFixed(2)
                      ) + "%"}
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
    </ChartContainer>
  );
};

export default PieChart;
