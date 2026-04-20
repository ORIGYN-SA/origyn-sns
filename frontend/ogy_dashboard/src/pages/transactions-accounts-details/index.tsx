import { Suspense, lazy, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useFecthOneAccount from "@hooks/accounts/useFetchOneAccount";
import useAccountBalanceHistory from "@hooks/metrics/useAccountBalanceHistory";
import usePrincipalOverview from "@hooks/accounts/usePrincipalOverview";
import useFetchOneAccountTransactions from "@hooks/transactions/useFetchOneAccountTransactions";
import { divideBy1e8, millify, roundAndFormatLocale } from "@helpers/numbers";
import {
  Card,
  NewTable,
  PageContainer,
  PageHeader,
  SkeletonOverlay,
  TablePagination,
} from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import {
  ChartStatsCard,
  PieStatsCard,
  Stat,
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

const BALANCE_PERIOD_OPTIONS = [
  { value: "30", label: "Monthly" },
  { value: "90", label: "Quarterly" },
  { value: "365", label: "Yearly" },
  { value: "lifetime", label: "Lifetime" },
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const FAKE_PRINCIPAL =
  "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaa";
const FAKE_SUBACCOUNT = "None (default subaccount)";
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
const InfoRow = ({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string | undefined;
  copyable?: boolean;
}) => (
  <div className="flex flex-col gap-2">
    <div className="text-[12px] font-bold leading-none text-muted">{label}</div>
    {value === undefined ? (
      <div className="h-4 w-full max-w-[420px] rounded-md bg-muted/20" />
    ) : (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[16px] font-bold leading-none text-content break-all">
          {value}
        </span>
        {copyable && <CopyToClipboard value={value} />}
      </div>
    )}
  </div>
);

const BalanceStatRow = ({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) => {
  if (value === undefined) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-3 w-[240px] rounded-md bg-muted/20" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-1">
      <span className="text-[13px] font-normal leading-none text-muted">
        {label}:
      </span>
      <span className="flex items-center gap-1">
        <img src="/ogy_logo.svg" alt="" className="w-2 h-2 shrink-0" />
        <span className="text-[12px] font-bold leading-none text-muted">
          {value}
        </span>
        <span className="text-[12px] font-medium leading-none text-muted">
          OGY
        </span>
      </span>
    </div>
  );
};

const TransactionsAccountsDetails = () => {
  const navigate = useNavigate();
  const params = useParams();
  const accountId = params.accountId as string;

  const [balancePeriod, setBalancePeriod] = useState("lifetime");
  const [txPageIndex, setTxPageIndex] = useState(0);
  const [txPageSize, setTxPageSize] = useState(10);
  const [txSortDesc, setTxSortDesc] = useState(true);

  const { data, isLoading } = useFecthOneAccount({ accountId });

  const lifetimeDays = useMemo(() => {
    if (!data?.created_timestamp) return 365;
    const createdMillis = Number(data.created_timestamp) / 1_000_000;
    const days = Math.ceil((Date.now() - createdMillis) / MS_PER_DAY);
    return Math.max(days + 1, 30);
  }, [data?.created_timestamp]);

  const balanceDays =
    balancePeriod === "lifetime" ? lifetimeDays : Number(balancePeriod);

  const {
    data: balanceHistory,
    isLoading: isLoadingBalance,
    isError: isBalanceError,
  } = useAccountBalanceHistory({
    account: accountId,
    days: balanceDays,
  });

  const { data: lifetimeBalance } = useAccountBalanceHistory({
    account: accountId,
    days: lifetimeDays,
  });

  const historicalMax = useMemo(() => {
    if (!lifetimeBalance?.dataChart?.length) return undefined;
    const max = Math.max(...lifetimeBalance.dataChart.map((d) => d.value));
    return roundAndFormatLocale({ number: max });
  }, [lifetimeBalance]);

  const genesisBalance = useMemo(() => {
    if (!lifetimeBalance?.dataChart?.length) return undefined;
    return roundAndFormatLocale({
      number: lifetimeBalance.dataChart[0].value,
    });
  }, [lifetimeBalance]);


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
    <PageContainer>
      <PageHeader
        category="Transaction History"
        title="OGY account"
        onBack={handleOnClickBack}
      />

      <Card className="mt-8 !p-0 overflow-hidden">
        <SkeletonOverlay loading={isLoading}>
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_1px_1fr]">
            <div className="py-8 px-5 flex flex-col gap-8">
              <InfoRow
                label="ID"
                value={data?.id ?? undefined}
                copyable={!!data?.id}
              />
              <InfoRow
                label="Owner"
                value={data?.owner}
                copyable={!!data?.owner}
              />
              <InfoRow
                label="Subaccount"
                value={data?.formatted.subaccount}
              />
            </div>

            <div className="hidden lg:block bg-border" />

            <div className="flex flex-col lg:min-w-[422px]">
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8 px-5">
              <span
                data-skel-static
                className="inline-block rounded-full bg-border-faint text-muted text-xs font-semibold px-3 py-1"
              >
                Balance
              </span>
              <Stat
                iconSrc="/ogy_logo.svg"
                value={
                  data?.balance !== undefined
                    ? millify(divideBy1e8(Number(data.balance)), 2)
                    : undefined
                }
                unit="OGY"
                loading={isLoading}
                size="hero"
              />
            </div>

            <div className="mt-auto border-t border-border bg-[#F9FAFE] py-4 px-5 space-y-2">
              <BalanceStatRow
                label="Historical max balance"
                value={historicalMax}
              />
              <BalanceStatRow
                label="Genesis balance"
                value={genesisBalance}
              />
            </div>
          </div>
          </div>
        </SkeletonOverlay>
      </Card>

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
    </PageContainer>
  );
};

export default TransactionsAccountsDetails;
