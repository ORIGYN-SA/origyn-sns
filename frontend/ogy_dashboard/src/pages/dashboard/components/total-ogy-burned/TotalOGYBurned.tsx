import BarChart from "@components/charts/bar/Bar";

type TotalOGYBurned = {
  className?: string;
};

const TotalOGYBurned = ({ className, ...restProps }: TotalOGYBurned) => {
  return (
    <div className={`${className} card`} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-500">
          Total OGY Burned
        </h2>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div>
      <div className="mt-4 flex items-center text-2xl font-semibold">
        <img src="/vite.svg" alt="OGY Logo" />
        <span className="ml-2 mr-3">202 281 245,91</span>
        <span className="text-gray-500">OGY</span>
      </div>
      <div className="mt-6 h-80 rounded-lg">
        <BarChart barFill="#34d399" />
      </div>
    </div>
  );
};

export default TotalOGYBurned;
