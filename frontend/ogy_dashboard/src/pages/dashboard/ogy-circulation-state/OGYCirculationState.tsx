import { useMemo } from "react";
import Card from "@components/ui/Card";
import PieChart from "@components/charts/pie/Pie";

type OGYCirculationState = {
  className?: string;
};

const OGYCirculationState = ({
  className,
  ...restProps
}: OGYCirculationState) => {
  const data = useMemo(
    () => [
      {
        name: "OGY not in the hand of the Foundation",
        value: 6957526202.66,
      },
      {
        name: "OGY locked in the hand of the Foundation",
        value: 6744999999.98,
      },
    ],
    []
  );

  const colors = useMemo(() => ["#645eff", "#333089"], []);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">OGY Circulation State</div>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Info
        </button>
      </div>

      <div className="mt-6 h-80 rounded-lg">
        <PieChart data={data} colors={colors} />
      </div>
      <div className="flex flex-col items-center my-4">
        <h2 className="text-lg font-semibold text-content/60">
          Total OGY Burned
        </h2>
        <div className="mt-4 flex items-center text-2xl font-semibold">
          <img src="/vite.svg" alt="OGY Logo" />
          <span className="ml-2 mr-3">202 281 245,91</span>
          <span className="text-content/60">OGY</span>
        </div>
      </div>
    </Card>
  );
};

export default OGYCirculationState;
