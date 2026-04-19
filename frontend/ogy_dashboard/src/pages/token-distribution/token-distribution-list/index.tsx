/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useNavigate } from "react-router-dom";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import {
  NewTable,
  NewTableColumn,
  TooltipInfo,
  TablePagination,
  SkeletonOverlay,
} from "@components/ui";
import { buildFakeRows } from "@helpers/skeleton/fakeData";
import useTokenDistribution from "@hooks/metrics/useTokenDistribution";
import { TableProps } from "@helpers/table/useTable";

const zeroOrDash = (value: string | undefined) => {
  if (!value) return "-";
  const numeric = parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) && numeric === 0 ? "-" : value;
};


const TokenDistributionList = ({
  pagination,
  setPagination,
}: TableProps) => {
  const navigate = useNavigate();

  const {
    data,
    isSuccess: isSuccessFetchTokenHolders,
    isFetching: isFetchingFetchTokenHolders,
    isError: isErrorFetchTokenHolders,
    error: errorFetchTokenHolders,
  } = useTokenDistribution({
    limit: pagination?.pageSize as number,
    offset: (pagination.pageSize * pagination.pageIndex) as number,
  });

  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;
  const pageCount = data?.list.pageCount ?? 0;


  const goToPage = (next: number) => {
    if (!setPagination) return;
    setPagination((prev) => ({ ...prev, pageIndex: next }));
  };

  const handlePageSizeChange = (next: number) => {
    if (!setPagination) return;
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

  const columns: NewTableColumn<any>[] = [
    {
      id: "principal",
      header: "Address",
      cell: (row) => (
        <div className="flex items-center gap-2 md:w-96 w-64">
          <button
            className="truncate min-w-0 hover:underline"
            onClick={() =>
              navigate(`/transaction-history/transactions/accounts/${row.principal}`)
            }
          >
            {row.principal}
          </button>
          <div className="ml-auto flex items-center gap-2 shrink-0">
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
      header: "Total",
      cell: (row) => <div className="w-40"><span>{zeroOrDash(row.total)}</span></div>,
    },
    {
      id: "governanceBalance",
      header: (
        <div className="flex items-center gap-2 leading-none">
          <span>Governance Balance</span>
          <TooltipInfo
            id="governance-balance-staked-tokens-tooltip"
            className="!text-white/90 xl:translate-y-[1px]"
          >
            Staked tokens
          </TooltipInfo>
        </div>
      ),
      cell: (row) => (
        <div className="w-40"><span>{zeroOrDash(row.governanceBalance)}</span></div>
      ),
    },
    {
      id: "ledgerBalance",
      header: "Ledger Balance",
      cell: (row) => (
        <div className="w-40"><span>{zeroOrDash(row.ledgerBalance)}</span></div>
      ),
    },
    {
      id: "weight",
      header: "Weight In Total Supply",
      cell: (row) => <div className="w-20"><span>{zeroOrDash(row.weight)}</span></div>,
    },
  ];


  const paginationFooter = setPagination ? (
    <TablePagination
      pageIndex={pageIndex}
      pageSize={pageSize}
      pageCount={pageCount}
      onPageChange={goToPage}
      onPageSizeChange={handlePageSizeChange}
    />
  ) : null;

  const rows =
    isFetchingFetchTokenHolders || !isSuccessFetchTokenHolders || !data
      ? skeletonRows
      : data.list.rows;

  if (isErrorFetchTokenHolders) {
    return (
      <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
        <div>{errorFetchTokenHolders?.message}</div>
      </div>
    );
  }

  return (
    <div>
      <SkeletonOverlay loading={isFetchingFetchTokenHolders}>
        <NewTable columns={columns} data={rows} footer={paginationFooter} />
      </SkeletonOverlay>
    </div>
  );
};

export default TokenDistributionList;
