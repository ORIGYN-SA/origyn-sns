import { useNavigate } from "react-router-dom";
import { Card, Button, NewTable, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import useFetchAllTransactions from "@hooks/transactions/useFetchAllTransactions";
import {
  getTransactionColumns,
  buildSkeletonRows,
} from "@pages/transactions/transactionColumns";
import { useT, useLocalePath } from "@i18n/LocaleContext";

const SKELETON_ROWS = buildSkeletonRows(10);

const TransactionHistory = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const t = useT();
  const lp = useLocalePath();
  const navigate = useNavigate();
  const navTo = (path: string) => navigate(lp(path));
  const { data, isSuccess, isLoading, isError } = useFetchAllTransactions({
    limit: 10,
    offset: 0,
    sorting: [{ id: "index", desc: true }],
  });

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;
  const columns = getTransactionColumns(navTo, t);
  const rows =
    showSkeleton || !isSuccess || !data ? SKELETON_ROWS : data.list.rows;

  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className={className} {...restProps}>
        {hasError && (
          <CardErrorOverlay title={t("dashboard.transactionHistory.title")} />
        )}
        <div data-skel-static className="flex items-center mb-8 gap-4">
          <div className="text-content text-[22px] font-semibold leading-none">
            {t("dashboard.transactionHistory.title")}
          </div>
          <Button
            onClick={() => navigate(lp("/transaction-history"))}
            className="min-w-fit ms-auto md:ms-0 !px-[25px] !py-0 text-[14px] leading-[40px]"
          >
            {t("dashboard.transactionHistory.showAll")}
          </Button>
        </div>
        <NewTable columns={columns} data={rows} />
      </Card>
    </SkeletonOverlay>
  );
};

export default TransactionHistory;
