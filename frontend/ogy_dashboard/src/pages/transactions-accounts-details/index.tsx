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
import { ChartStatsCard, PieStatsCard, Stat } from "@components/dashboard";
import { PieChartProvider } from "@components/charts/pie/context";
import {
  getTransactionColumns,
  buildSkeletonRows,
} from "@pages/transactions/transactionColumns";
import { useT, useLocalePath } from "@i18n/LocaleContext";

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

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const OVERVIEW_COLORS = ["#645eff", "#333089"];
const InfoRow = ({
  label,
  value,
  copyable,
  loading,
}: {
  label: string;
  value: string | undefined;
  copyable?: boolean;
  loading?: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
      {label}
    </div>
    {loading ? (
      <div className="h-4 w-full max-w-[420px] rounded-md bg-muted/20" />
    ) : (
      // Account ID / principal / subaccount + copy icon: inherently-LTR
      // identifier cluster; pin dir so it doesn't scramble under RTL.
      <div dir="ltr" className="flex items-center gap-2 min-w-0">
        <span className="text-[13px] font-semibold leading-tight text-content break-all">
          {value ?? "—"}
        </span>
        {copyable && value && <CopyToClipboard value={value} />}
      </div>
    )}
  </div>
);

const BalanceStatRow = ({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | undefined;
  loading?: boolean;
}) => {
  if (loading) {
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
      {/* Currency cluster (logo + amount + OGY) stays LTR in every locale. */}
      <span dir="ltr" className="flex items-center gap-1">
        <img src="/ogy_logo.svg" alt="" className="w-2 h-2 shrink-0" />
        <span className="text-[12px] font-bold leading-none text-muted">
          {value ?? "0"}
        </span>
        <span className="text-[12px] font-medium leading-none text-muted">
          OGY
        </span>
      </span>
    </div>
  );
};

const TransactionsAccountsDetails = () => {
  const t = useT();
  const lp = useLocalePath();
  const navigate = useNavigate();
  const navTo = (path: string) => navigate(lp(path));
  const params = useParams();
  const accountId = params.accountId as string;

  const balancePeriodOptions = useMemo(
    () => [
      { value: "30", label: t("transactions.accountDetails.period.monthly") },
      { value: "90", label: t("transactions.accountDetails.period.quarterly") },
      { value: "365", label: t("transactions.accountDetails.period.yearly") },
      {
        value: "lifetime",
        label: t("transactions.accountDetails.period.lifetime"),
      },
    ],
    [t]
  );

  const overviewInfos = useMemo(
    () => [
      {
        id: "tooltip-total-sent",
        name: t("transactions.accountDetails.overview.totalSent"),
        value: t("transactions.accountDetails.overview.totalSentInfo"),
      },
      {
        id: "tooltip-total-received",
        name: t("transactions.accountDetails.overview.totalReceived"),
        value: t("transactions.accountDetails.overview.totalReceivedInfo"),
      },
    ],
    [t]
  );

  const [balancePeriod, setBalancePeriod] = useState("lifetime");
  const [txPageIndex, setTxPageIndex] = useState(0);
  const [txPageSize, setTxPageSize] = useState(10);
  const [txSortDesc, setTxSortDesc] = useState(true);

  const {
    data,
    isLoading,
    isError: isAccountError,
  } = useFecthOneAccount({
    accountId,
  });
  const accountNotIndexed = !isLoading && isAccountError;
  const hasNoTransactions =
    accountNotIndexed || (data?.total_transactions === 0 && !isLoading);

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
        name: t("transactions.accountDetails.overview.totalSent"),
        value: overview.totalSend,
        valueToString: roundAndFormatLocale({ number: overview.totalSend }),
      },
      {
        name: t("transactions.accountDetails.overview.totalReceived"),
        value: overview.totalReceive,
        valueToString: roundAndFormatLocale({ number: overview.totalReceive }),
      },
    ];
  }, [overview, t]);

  const txColumns = useMemo(
    () =>
      getTransactionColumns(navTo, t, {
        desc: txSortDesc,
        onToggle: () => {
          setTxSortDesc((d) => !d);
          setTxPageIndex(0);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, lp, t, txSortDesc]
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
        category={t("transactions.history.title")}
        title={t("transactions.accountDetails.title")}
        onBack={handleOnClickBack}
      />

      <Card className="mt-8 !p-0 overflow-hidden">
        <SkeletonOverlay loading={isLoading}>
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_1px_1fr]">
            <div className="py-8 px-5 flex flex-col gap-8">
              <InfoRow
                label={t("transactions.accountDetails.id")}
                value={data?.id ?? (accountNotIndexed ? accountId : undefined)}
                copyable
                loading={isLoading}
              />
              <InfoRow
                label={t("transactions.accountDetails.owner")}
                value={
                  data?.owner ?? (accountNotIndexed ? accountId : undefined)
                }
                copyable
                loading={isLoading}
              />
              <InfoRow
                label={t("transactions.accountDetails.subaccount")}
                value={
                  data?.formatted.subaccount ??
                  (accountNotIndexed
                    ? t("transactions.accountDetails.defaultSubaccount")
                    : undefined)
                }
                loading={isLoading}
              />
            </div>

            <div className="hidden lg:block bg-border" />

            <div className="flex flex-col lg:min-w-[422px]">
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8 px-5">
                <span
                  data-skel-static
                  className="inline-block rounded-full border border-border-strong bg-surface-2 px-3 py-1 text-xs font-semibold text-content/80"
                >
                  {t("common.balance")}
                </span>
                <Stat
                  iconSrc="/ogy_logo.svg"
                  value={
                    data?.balance !== undefined
                      ? millify(divideBy1e8(Number(data.balance)), 2)
                      : accountNotIndexed
                        ? "0"
                        : undefined
                  }
                  unit="OGY"
                  loading={isLoading}
                  size="hero"
                />
              </div>

              <div className="mt-auto border-t border-border bg-surface-muted py-4 px-5 space-y-2">
                <BalanceStatRow
                  label={t("transactions.accountDetails.historicalMaxBalance")}
                  value={historicalMax}
                  loading={isLoading}
                />
                <BalanceStatRow
                  label={t("transactions.accountDetails.genesisBalance")}
                  value={genesisBalance}
                  loading={isLoading}
                />
              </div>
            </div>
          </div>
        </SkeletonOverlay>
      </Card>

      {hasNoTransactions ? (
        <Card className="mt-16">
          <div className="flex flex-col items-center gap-3 text-center py-16 px-6">
            <h4 className="text-content text-base font-semibold">
              {t("transactions.accountDetails.empty.title")}
            </h4>
            <p className="text-sm text-muted max-w-[420px]">
              {t("transactions.accountDetails.empty.description")}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Suspense fallback={<TransactionsChartFallback />}>
            <TransactionsChart id={accountId} />
          </Suspense>

          <ChartStatsCard
            className="mt-16"
            title={t("transactions.accountDetails.balanceHistory.title")}
            periodOptions={balancePeriodOptions}
            period={balancePeriod}
            onPeriodChange={setBalancePeriod}
            stats={[
              {
                id: "current-balance",
                label: t(
                  "transactions.accountDetails.balanceHistory.currentBalance"
                ),
                tooltipContent: (
                  <p>
                    {t(
                      "transactions.accountDetails.balanceHistory.currentBalanceInfo"
                    )}
                  </p>
                ),
                value: balanceHistory?.total,
                unit: "OGY",
              },
            ]}
            chart={{
              data: balanceHistory?.dataChart,
              color: "#38bdf8",
              label: t("transactions.accountDetails.balanceHistory.legend"),
            }}
            legendLabel={t(
              "transactions.accountDetails.balanceHistory.legend"
            )}
            loading={isLoadingBalance}
            isError={isBalanceError}
          />

          <div className="mt-16">
            <PieChartProvider>
              <PieStatsCard
                title={t("transactions.accountDetails.overview.title")}
                data={overviewChartData}
                colors={OVERVIEW_COLORS}
                infos={overviewInfos}
                totalLabel={t("transactions.accountDetails.overview.totalLabel")}
                totalValue={
                  overview
                    ? roundAndFormatLocale({ number: overview.totalVolume })
                    : undefined
                }
                loading={isLoadingOverview}
                isError={isOverviewError}
                layout="horizontal"
              />
            </PieChartProvider>
          </div>

          <Card id="transaction-history-table" className="mt-16 scroll-mt-24">
            <div className="mb-8">
              <div className="text-content text-[22px] font-semibold leading-none">
                {t("transactions.history.title")}
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
        </>
      )}
    </PageContainer>
  );
};

export default TransactionsAccountsDetails;
