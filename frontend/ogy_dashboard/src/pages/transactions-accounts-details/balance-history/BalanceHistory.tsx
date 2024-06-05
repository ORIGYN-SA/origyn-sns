import { useEffect, useMemo, useState } from "react";
// import BarChart from "@components/charts/bar/Bar";
import AreaChart from "@components/charts/area/Area";
import { Card } from "@components/ui";
import useAccountBalanceHistory from "@hooks/metrics/useAccountBalanceHistory";
import { ChartData } from "@services/types/charts.types";

type BalanceHistoryProps = {
  className?: string;
  account: string;
};

const BalanceHistory = ({ className, account, ...restProps }: BalanceHistoryProps) => {
  const [graphData, setGraphData] = useState(
    [] as ChartData[]
  );
  const barFill = useMemo(() => "#38bdf8", []);
  const { data, isSuccess } = useAccountBalanceHistory(account);

  useEffect(() => {
    if (isSuccess) {
      setGraphData(data);
    }
  }, [isSuccess, data]);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-content/60 mr-2">
            Balance
          </h2>
        </div>
      </div>
      <div className="mt-6 h-72 rounded-xl">
        <AreaChart data={graphData} fill={barFill} />
      </div>
    </Card>
  );
};

export default BalanceHistory;
