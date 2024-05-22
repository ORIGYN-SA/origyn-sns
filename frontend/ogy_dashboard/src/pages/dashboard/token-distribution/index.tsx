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
  const [pagination] = usePagination({ pageIndex: 0, pageSize: 10 });

  const handleShowAllTokenDistribution = () => {
    navigate("/token-distribution");
  };

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center mb-8 gap-8">
        <div className="text-lg font-semibold">Token Distribution</div>
        <Button onClick={handleShowAllTokenDistribution}>Show all</Button>
      </div>
      <TokenDistributionList pagination={pagination} />
    </Card>
  );
};

export default TokenDistribution;
