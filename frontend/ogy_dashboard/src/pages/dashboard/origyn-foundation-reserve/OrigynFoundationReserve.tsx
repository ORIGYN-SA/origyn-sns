import { useMemo } from "react";
import Card from "@components/ui/Card";
import PieChart from "@components/charts/pie/Pie";

type OrigynFoundationReserve = {
  className?: string;
};

const OrigynFoundationReserve = ({
  className,
  ...restProps
}: OrigynFoundationReserve) => {
  const data = useMemo(
    () => [
      {
        name: "Locked",
        value: 6957526202.66,
      },
      {
        name: "unlocked",
        value: 744999999.98,
      },
    ],
    []
  );
  const colors = useMemo(() => ["#ff55c5", "#90306f"], []);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">OGY Foundation Reserve</div>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Info
        </button>
      </div>

      <div className="mt-6 h-80 rounded-lg">
        <PieChart data={data} colors={colors} />
      </div>
      <div className="flex flex-col items-center my-4">
        <div className="flex flex-col items-center my-4">
          <h2 className="text-lg font-semibold text-content/60">
            Total Foundation Supply
          </h2>
          <div className="mt-4 flex items-center text-2xl font-semibold">
            <img src="/vite.svg" alt="OGY Logo" />
            <span className="ml-2 mr-3">202 281 245,91</span>
            <span className="text-content/60">OGY</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OrigynFoundationReserve;
