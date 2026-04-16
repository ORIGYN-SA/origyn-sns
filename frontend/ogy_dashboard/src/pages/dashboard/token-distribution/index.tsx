import { Card } from "@components/ui";
import TokenDistributionList from "@pages/token-distribution/token-distribution-list";
import { usePagination } from "@helpers/table/useTable";

const TokenDistribution = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [pagination, setPagination] = usePagination({
    pageIndex: 0,
    pageSize: 10,
  });

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="mb-8">
        <div className="text-charcoal text-[22px] font-semibold leading-none">
          Token Distribution
        </div>
      </div>
      <TokenDistributionList
        pagination={pagination}
        setPagination={setPagination}
      />
    </Card>
  );
};

export default TokenDistribution;
