import { useNavigate } from "react-router-dom";
import { Card, Button } from "@components/ui";
import TokenDistributionList from "@pages/token-distribution/token-distribution-list";
import { usePagination } from "@helpers/table/useTable";

const TokenDistribution = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const navigate = useNavigate();
  const [pagination, setPagination] = usePagination({
    pageIndex: 0,
    pageSize: 10,
  });

  const handleShowAllTokenDistribution = () => {
    navigate("/token-distribution");
  };

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center mb-8 gap-4">
        <div className="text-charcoal text-[22px] font-semibold leading-none">
          Token Distribution
        </div>
        <Button
          onClick={handleShowAllTokenDistribution}
          className="min-w-fit ml-auto md:ml-0 !px-[25px] !py-0 text-[14px] leading-[40px]"
        >
          Show all
        </Button>
      </div>
      <TokenDistributionList
        pagination={pagination}
        setPagination={setPagination}
      />
    </Card>
  );
};

export default TokenDistribution;
