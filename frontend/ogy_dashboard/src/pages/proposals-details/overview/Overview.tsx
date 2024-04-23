import Card from "@components/ui/Card";

type TotalOGYSupply = {
  className?: string;
};

const TotalOGYSupply = ({ className, ...restProps }: TotalOGYSupply) => {
  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content/60">
          Total OGY Supply
        </h2>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div>
      <div className="mt-4 flex items-center text-2xl font-semibold">
        <img src="/vite.svg" alt="OGY Logo" />
        <span className="ml-2 mr-3">10 418 169 376,19</span>
        <span className="text-content/60">OGY</span>
      </div>
    </Card>
  );
};

export default TotalOGYSupply;
