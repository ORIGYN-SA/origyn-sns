import { useNavigate } from "react-router-dom";
import { Card, Button, NewTable, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import useFetchAllTransactions from "@hooks/transactions/useFetchAllTransactions";
import {
  getTransactionColumns,
  buildSkeletonRows,
} from "@pages/transactions/transactionColumns";

const SKELETON_ROWS = buildSkeletonRows(10);

const TransactionHistory = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const navigate = useNavigate();
  const { data, isSuccess, isLoading, isError } = useFetchAllTransactions({
    limit: 10,
    offset: 0,
    sorting: [{ id: "index", desc: true }],
  });

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;
  const columns = getTransactionColumns(navigate);
  const rows =
    showSkeleton || !isSuccess || !data ? SKELETON_ROWS : data.list.rows;

  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className={className} {...restProps}>
        {hasError && <CardErrorOverlay title="Transaction History" />}
        <div data-skel-static className="flex items-center mb-8 gap-4">
          <div className="text-charcoal text-[22px] font-semibold leading-none">
            Transaction History
          </div>
          <Button
            onClick={() => navigate("/transaction-history")}
            className="min-w-fit ml-auto md:ml-0 !px-[25px] !py-0 text-[14px] leading-[40px]"
          >
            Show all
          </Button>
        </div>
        <NewTable columns={columns} data={rows} />
      </Card>
    </SkeletonOverlay>
  );
};

export default TransactionHistory;
