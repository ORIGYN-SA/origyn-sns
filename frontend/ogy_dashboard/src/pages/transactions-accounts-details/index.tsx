import { Suspense, lazy, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import useFecthOneAccount from "@hooks/accounts/useFetchOneAccount";
import useAccountBalanceHistory from "@hooks/metrics/useAccountBalanceHistory";
import usePrincipalOverview from "@hooks/accounts/usePrincipalOverview";
import useFetchOneAccountTransactions from "@hooks/transactions/useFetchOneAccountTransactions";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import {
  Card,
  NewTable,
  SkeletonOverlay,
  TablePagination,
} from "@components/ui";
import {
  StatCard,
  ChartStatsCard,
  PieStatsCard,
} from "@components/dashboard";
import { PieChartProvider } from "@components/charts/pie/context";
import {
  getTransactionColumns,
  buildSkeletonRows,
} from "@pages/transactions/transactionColumns";

const TransactionsChart = lazy(
  () => import("./transactions-chart/TransactionsChart")
);

const TransactionsChartFallback = () => (
  <div
    aria-busy="true"
    className="rounded-xl bg-muted/20 animate-pulse"
    style={{ height: 800, width: "100%" }}
  />
);

const BALANCE_PERIOD_OPTIONS = [{ value: "monthly", label: "Monthly" }];
const OVERVIEW_COLORS = ["#645eff", "#333089"];
const OVERVIEW_INFOS = [
  {
    id: "tooltip-total-sent",
    name: "Total Sent",
    value: "Total amount sent by the principal.",
  },
  {
    id: "tooltip-total-received",
    name: "Total Received",
    value: "Total amount received by the principal.",
  },
];
const TransactionsAccountsDetails = () => {
  const navigate = useNavigate();
  const params = useParams();
  const accountId = params.accountId as string;

  const [balancePeriod, setBalancePeriod] = useState("monthly");
  const [txPageIndex, setTxPageIndex] = useState(0);
  const [txPageSize, setTxPageSize] = useState(10);
  const [txSortDesc, setTxSortDesc] = useState(true);

  const { data, isLoading } = useFecthOneAccount({ accountId });

  const {
    data: balanceHistory,
    isLoading: isLoadingBalance,
    isError: isBalanceError,
  } = useAccountBalanceHistory({ account: accountId });

  const {
    data: overview,
    isLoading: isLoadingOverview,
    isError: isOverviewError,
    error: overviewError,
  } = usePrincipalOverview(accountId);

  const {
    data: transactions,
    isLoading: isLoadingTx,
    isFetching: isFetchingTx,
  } = useFetchOneAccountTransactions({
    limit: txPageSize,
    offset: txPageSize * txPageIndex,
    sorting: [{ id: "index", desc: txSortDesc }],
    accountId,
  });

  const overviewChartData = useMemo(() => {
    if (!overview) return undefined;
    return [
      {
        name: "Total Sent",
        value: overview.totalSend,
        valueToString: roundAndFormatLocale({ number: overview.totalSend }),
      },
      {
        name: "Total Received",
        value: overview.totalReceive,
        valueToString: roundAndFormatLocale({ number: overview.totalReceive }),
      },
    ];
  }, [overview]);

  const txColumns = useMemo(
    () =>
      getTransactionColumns(navigate, {
        desc: txSortDesc,
        onToggle: () => {
          setTxSortDesc((d) => !d);
          setTxPageIndex(0);
        },
      }),
    [navigate, txSortDesc]
  );
  const txPageCount = transactions?.list.pageCount ?? 0;
  const txRows =
    isLoadingTx || !transactions?.list.rows
      ? buildSkeletonRows(txPageSize)
      : transactions.list.rows;

  const handleTxPageChange = (next: number) => setTxPageIndex(next);
  const handleTxPageSizeChange = (next: number) => {
    setTxPageSize(next);
    setTxPageIndex(0);
  };

  const handleOnClickBack = () => navigate(-1);

  return (
    <div className="container mx-auto pt-8 pb-16 px-4">
      <div className="div div-col xl:div-row items-center justify-between py-8">
        <div className="div div-col xl:div-row xl:justify-center items-center gap-4 xl:gap-8">
          <ArrowLeftIcon
            className="h-8 w-8 hover:cursor-pointer"
            onClick={handleOnClickBack}
          />
          <div className="div div-col items-center xl:items-start">
            <div className="text-sm">Explorer</div>
            <div className="text-3xl font-bold mb-4 xl:mb-0">OGY account</div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mt-8">
        <Card className="xl:col-span-2">
          <div className="mb-4">
            <div className="text-content/60">ID</div>
            <div className="font-bold break-all">{data?.id}</div>
          </div>
          <div className="mb-4">
            <div className="text-content/60">Owner</div>
            <div className="font-bold break-all">{data?.owner}</div>
          </div>
          <div>
            <div className="text-content/60">Subaccount</div>
            <div className="font-bold break-all">
              {data?.formatted.subaccount}
            </div>
          </div>
        </Card>
        <StatCard
          accessory={
            <img src="/ogy_logo.svg" alt="" className="w-6 h-6" />
          }
          title="Balance"
          value={
            data?.balance !== undefined
              ? roundAndFormatLocale({
                  number: divideBy1e8(Number(data.balance)),
                })
              : undefined
          }
          unit="OGY"
          loading={isLoading}
        />
      </div>

      <Suspense fallback={<TransactionsChartFallback />}>
        <TransactionsChart id={accountId} />
      </Suspense>

      <ChartStatsCard
        className="mt-16"
        title="Balance History"
        periodOptions={BALANCE_PERIOD_OPTIONS}
        period={balancePeriod}
        onPeriodChange={setBalancePeriod}
        stats={[
          {
            id: "current-balance",
            label: "Current balance",
            tooltipContent: <p>Current account balance.</p>,
            value: balanceHistory?.total,
            unit: "OGY",
          },
        ]}
        chart={{
          data: balanceHistory?.dataChart,
          color: "#38bdf8",
          label: "OGY Balance",
        }}
        legendLabel="OGY Balance"
        loading={isLoadingBalance}
        isError={isBalanceError}
        errorMessage="Error while fetching account balance data."
      />

      <div className="mt-16">
        <PieChartProvider>
          <PieStatsCard
            title="Transactions Overview"
            data={overviewChartData}
            colors={OVERVIEW_COLORS}
            infos={OVERVIEW_INFOS}
            totalLabel="Total amount"
            totalValue={
              overview
                ? roundAndFormatLocale({ number: overview.totalVolume })
                : undefined
            }
            loading={isLoadingOverview}
            isError={isOverviewError}
            errorMessage={overviewError?.message}
            layout="horizontal"
          />
        </PieChartProvider>
      </div>

      <Card className="mt-16">
        <div className="mb-8">
          <div className="text-charcoal text-[22px] font-semibold leading-none">
            Transaction History
          </div>
        </div>
        <SkeletonOverlay loading={isFetchingTx}>
          <NewTable
            columns={txColumns}
            data={txRows}
            footer={
              <TablePagination
                pageIndex={txPageIndex}
                pageSize={txPageSize}
                pageCount={txPageCount}
                onPageChange={handleTxPageChange}
                onPageSizeChange={handleTxPageSizeChange}
              />
            }
          />
        </SkeletonOverlay>
      </Card>
    </div>
  );
};

export default TransactionsAccountsDetails;
