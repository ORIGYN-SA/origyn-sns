import { Card, Button } from "@components/ui";
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
      <div className="flex items-center mb-8 gap-8">
        <div className="text-lg font-semibold">Token Distribution</div>
        <Button onClick={() => null}>Show all</Button>
      </div>
      <TokenDistributionList pagination={pagination} />
    </Card>
  );
};

export default TokenDistribution;
