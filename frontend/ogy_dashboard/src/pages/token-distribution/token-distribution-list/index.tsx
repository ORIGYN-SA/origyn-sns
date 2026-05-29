import { useNavigate } from "react-router-dom";
import { useLocalePath, useT } from "@i18n/LocaleContext";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { NewTable, TooltipInfo, TablePagination } from "@components/ui";
import { NewTableColumn } from "@components/ui/NewTable";
import { buildFakeRows } from "@helpers/skeleton/fakeData";
import useTokenDistribution from "@hooks/metrics/useTokenDistribution";
import { TableProps } from "@helpers/table/useTable";

type TokenDistributionRow = {
  principal: string;
  tag?: string;
  total: string;
  governanceBalance: string;
  ledgerBalance: string;
  weight: string;
};

type TokenDistributionListProps = Required<
  Pick<TableProps, "pagination" | "setPagination">
>;

const zeroOrDash = (value: string | undefined) => {
  if (!value) return "-";
  const numeric = parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) && numeric === 0 ? "-" : value;
};

const TokenDistributionList = ({
  pagination,
  setPagination,
}: TokenDistributionListProps) => {
  const navigate = useNavigate();
  const lp = useLocalePath();
  const t = useT();

  const {
    data,
    isSuccess: isSuccessFetchTokenHolders,
    isFetching: isFetchingFetchTokenHolders,
  } = useTokenDistribution({
    limit: pagination.pageSize,
    offset: pagination.pageSize * pagination.pageIndex,
  });

  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;
  const pageCount = data?.list.pageCount ?? 0;

  const goToPage = (next: number) => {
    setPagination((prev) => ({ ...prev, pageIndex: next }));
  };

  const handlePageSizeChange = (next: number) => {
    setPagination(() => ({ pageIndex: 0, pageSize: next }));
  };

  const rowCount = data?.list.rowCount ?? 0;
  const expectedRowsOnThisPage =
    rowCount > 0
      ? Math.min(pageSize, Math.max(0, rowCount - pageIndex * pageSize))
      : pageSize;

  const FAKE_TOKEN_ROW = {
    principal: "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaa",
    total: "1,000,000.00",
    governanceBalance: "500,000.00",
    ledgerBalance: "500,000.00",
    weight: "10.00%",
    tag: "",
  };
  const skeletonRows = buildFakeRows(FAKE_TOKEN_ROW, expectedRowsOnThisPage);

  const columns: NewTableColumn<TokenDistributionRow>[] = [
    {
      id: "principal",
      header: t("tokenDistribution.list.address"),
      cell: (row) => (
        <div className="flex items-center gap-2 md:w-96 w-64">
          <button
            dir="ltr"
            className="truncate min-w-0 text-start hover:underline"
            onClick={() =>
              navigate(
                lp(
                  `/transaction-history/transactions/accounts/${row.principal}`
                )
              )
            }
          >
            {row.principal}
          </button>
          <div className="ms-auto flex items-center gap-2 shrink-0">
            <CopyToClipboard value={row.principal} />
            {row?.tag ? (
              <TooltipInfo id={`tooltip_${row.tag}`} clickable={false}>
                {row.tag}
              </TooltipInfo>
            ) : (
              <div className="inline-block w-4 h-4" aria-hidden="true" />
            )}
          </div>
        </div>
      ),
    },
    {
      id: "total",
      header: t("common.total"),
      cell: (row) => (
        <div dir="ltr" className="w-40 text-start">
          <span>{zeroOrDash(row.total)}</span>
        </div>
      ),
    },
    {
      id: "governanceBalance",
      header: (
        <div className="flex items-center gap-2 leading-none">
          <span>{t("tokenDistribution.list.governanceBalance")}</span>
          <TooltipInfo
            id="governance-balance-staked-tokens-tooltip"
            className="!text-white/90 xl:translate-y-[1px]"
          >
            {t("tokenDistribution.list.stakedTokens")}
          </TooltipInfo>
        </div>
      ),
      cell: (row) => (
        <div dir="ltr" className="w-40 text-start">
          <span>{zeroOrDash(row.governanceBalance)}</span>
        </div>
      ),
    },
    {
      id: "ledgerBalance",
      header: t("tokenDistribution.list.ledgerBalance"),
      cell: (row) => (
        <div dir="ltr" className="w-40 text-start">
          <span>{zeroOrDash(row.ledgerBalance)}</span>
        </div>
      ),
    },
    {
      id: "weight",
      header: t("tokenDistribution.list.weightInTotalSupply"),
      cell: (row) => (
        <div dir="ltr" className="w-20 text-start">
          <span>{zeroOrDash(row.weight)}</span>
        </div>
      ),
    },
  ];

  const paginationFooter = (
    <TablePagination
      pageIndex={pageIndex}
      pageSize={pageSize}
      pageCount={pageCount}
      onPageChange={goToPage}
      onPageSizeChange={handlePageSizeChange}
    />
  );

  const rows =
    isFetchingFetchTokenHolders || !isSuccessFetchTokenHolders || !data
      ? skeletonRows
      : data.list.rows;

  return (
    <div>
      <NewTable columns={columns} data={rows} footer={paginationFooter} />
    </div>
  );
};

export default TokenDistributionList;
