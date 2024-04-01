import { useMemo } from "react";
import BarChart from "@components/charts/bar/Bar";
import Card from "@components/cards/Card";

type TotalOGYSupply = {
  className?: string;
};

const TotalOGYSupply = ({ className, ...restProps }: TotalOGYSupply) => {
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

  const barFill = useMemo(() => "#38bdf8", []);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-500">
          Total OGY Supply
        </h2>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div>
      <div className="mt-4 flex items-center text-2xl font-semibold">
        <img src="/vite.svg" alt="OGY Logo" />
        <span className="ml-2 mr-3">10 418 169 376,19</span>
        <span className="text-gray-500">OGY</span>
      </div>
      <div className="mt-6 h-80 rounded-lg">
        <BarChart data={data} barFill={barFill} />
      </div>
    </Card>
  );
};

export default TotalOGYSupply;
