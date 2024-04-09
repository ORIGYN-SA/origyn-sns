import { useMemo } from "react";
import Card from "@components/ui/Card";
import BarChart from "@components/charts/bar/Bar";

type TotalOGYBurned = {
  className?: string;
};

const TotalOGYBurned = ({ className, ...restProps }: TotalOGYBurned) => {
  const data = useMemo(
    () => [
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
    []
  );

  const barFill = useMemo(() => "#34d399", []);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content/60">
          Total OGY Burned
        </h2>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div>
      <div className="mt-4 flex items-center text-2xl font-semibold">
        <img src="/vite.svg" alt="OGY Logo" />
        <span className="ml-2 mr-3">202 281 245,91</span>
        <span className="text-content/60">OGY</span>
      </div>
      <div className="mt-6 h-80 rounded-lg">
        <BarChart data={data} barFill={barFill} />
      </div>
    </Card>
  );
};

export default TotalOGYBurned;
