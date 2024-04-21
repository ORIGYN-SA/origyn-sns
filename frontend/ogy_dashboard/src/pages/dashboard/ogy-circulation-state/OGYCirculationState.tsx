import { useMemo } from "react";
import Card from "@components/ui/Card";
import PieChart from "@components/charts/pie/Pie";
import useOGYCirculationState from "./useOGYCirculationState";

type OGYCirculationState = {
  className?: string;
};

const OGYCirculationState = ({
  className,
  ...restProps
}: OGYCirculationState) => {
  const colors = useMemo(() => ["#645eff", "#333089"], []);
  const { circulationData, isLoading, error } = useOGYCirculationState();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">OGY Circulation State</div>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Info
        </button>
      </div>
      <div className="mt-6 h-80 rounded-lg">
        <PieChart data={circulationData.dataPieChart} colors={colors} />
      </div>
      <div className="flex flex-col items-center my-4">
        <h2 className="text-lg font-semibold text-content/60">
          Total OGY Circulation
        </h2>
        <div className="mt-4 flex items-center text-2xl font-semibold">
          <img src="/vite.svg" alt="OGY Logo" />
          <span className="ml-2 mr-3">
            {circulationData.totalCirculationState}
          </span>
          <span className="text-content/60">OGY</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {circulationData.dataPieChart.map(({ name, valueToString }, index) => (
          <Card className="bg-surface-2 mt-8 pb-8" key={name}>
            <div className="flex items-center text-lg">
              {/* <img src="/vite.svg" alt="OGY Logo" /> */}
              <span className="text-content/60">{name}</span>
            </div>
            <div className="flex items-center mt-4 text-2xl font-semibold">
              <span className="mr-3">{valueToString}</span>
              <span className="text-content/60">OGY</span>
            </div>
            <Card.BorderBottom color={colors[index]} />
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default OGYCirculationState;
