import { useMemo } from "react";
import Card from "@components/ui/Card";
import PieChart from "@components/charts/pie/Pie";
import useOGYCirculationState from "./useOGYCirculationState";
import { usePieChart } from "@components/charts/pie/context";

type OGYCirculationState = {
  className?: string;
};

const OGYCirculationState = ({
  className,
  ...restProps
}: OGYCirculationState) => {
  const colors = useMemo(() => ["#645eff", "#333089"], []);
  const { circulationData, isLoading, error } = useOGYCirculationState();
  const { activeIndex, setActiveIndex } = usePieChart();

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
      <div className="mt-6 h-80 rounded-xl">
        <PieChart data={circulationData.dataPieChart} colors={colors} />
      </div>
      <div className="flex flex-col items-center my-4">
        <h2 className="text-lg font-semibold text-content/60">
          Total OGY Circulation
        </h2>
        <div className="mt-4 flex items-center text-2xl font-semibold">
          <img src="/ogy_logo.svg" alt="OGY Logo" />
          <span className="ml-2 mr-3">
            {circulationData.totalCirculationState}
          </span>
          <span className="text-content/60">OGY</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {circulationData.dataPieChart.map(({ name, valueToString }, index) => (
          <Card
            className={`bg-surface-2/40 dark:bg-surface-2 mt-8 pb-8 dark:hover:bg-white/10 hover:bg-black/5 ${
              activeIndex === index ? `dark:bg-white/10 bg-black/5` : ``
            } transition-opacity duration-300`}
            key={name}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center text-lg">
              <div
                className="h-3 w-3 rounded-full mr-2"
                style={{ backgroundColor: colors[index] }}
              ></div>
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
