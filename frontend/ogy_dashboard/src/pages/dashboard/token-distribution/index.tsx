import { Card } from "@components/ui";
import TokenDistributionList from "@pages/token-distribution/token-distribution-list";
import { usePagination } from "@helpers/table/useTable";

const TokenDistribution = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [pagination] = usePagination({ pageIndex: 0, pageSize: 10 });

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between mb-8">
        <div className="text-lg font-semibold">
          ORIGYN Treasury Account (OTA)
        </div>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div>
      <TokenDistributionList pagination={pagination} />
    </Card>
  );
};

export default TokenDistribution;
