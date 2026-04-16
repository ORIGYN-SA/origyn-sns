/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useNavigate } from "react-router-dom";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { NewTable, NewTableColumn, TooltipInfo } from "@components/ui";
import useTokenDistribution from "@hooks/metrics/useTokenDistribution";
import { TableProps } from "@helpers/table/useTable";

const zeroOrDash = (value: string | undefined) => {
  if (!value) return "-";
  const numeric = parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) && numeric === 0 ? "-" : value;
};

const SkeletonBar = ({ className = "" }: { className?: string }) => (
  <span className={`block h-6 rounded bg-muted/20 animate-pulse ${className}`} />
);

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type PageItem = number | "ellipsis";

const buildPageItems = (pageIndex: number, pageCount: number): PageItem[] => {
  if (pageCount <= 0) return [];
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const current = pageIndex + 1;
  const items: PageItem[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pageCount - 1, current + 1);
  if (start > 2) items.push("ellipsis");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < pageCount - 1) items.push("ellipsis");
  items.push(pageCount);
  return items;
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
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  const goToPage = (next: number) => {
    if (!setPagination) return;
    setPagination((prev) => ({ ...prev, pageIndex: next }));
  };

  const handlePageSizeChange = (next: number) => {
    if (!setPagination) return;
    setPagination(() => ({ pageIndex: 0, pageSize: next }));
  };

  const pageItems = buildPageItems(pageIndex, pageCount);

  const rowCount = data?.list.rowCount ?? 0;
  const expectedRowsOnThisPage =
    rowCount > 0
      ? Math.min(pageSize, Math.max(0, rowCount - pageIndex * pageSize))
      : pageSize;
  const skeletonRows = Array.from(
    { length: expectedRowsOnThisPage },
    (_, i) => ({ id: i })
  );

  const columns: NewTableColumn<any>[] = [
    {
      id: "principal",
      header: "Address",
      cell: (row) => (
        <div className="flex items-center gap-2 md:w-96 w-64">
          <button
            className="truncate min-w-0 hover:underline"
            onClick={() =>
              navigate(`/explorer/transactions/accounts/${row.principal}`)
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
              <span className="inline-block w-4 h-4" aria-hidden="true" />
            )}
          </div>
        </div>
      ),
    },
    {
      id: "total",
      header: "Total",
      cell: (row) => <div className="w-40">{zeroOrDash(row.total)}</div>,
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
        <div className="w-40">{zeroOrDash(row.governanceBalance)}</div>
      ),
    },
    {
      id: "ledgerBalance",
      header: "Ledger Balance",
      cell: (row) => (
        <div className="w-40">{zeroOrDash(row.ledgerBalance)}</div>
      ),
    },
    {
      id: "weight",
      header: "Weight In Total Supply",
      cell: (row) => <div className="w-20">{zeroOrDash(row.weight)}</div>,
    },
  ];

  const skeletonColumns: NewTableColumn<{ id: number }>[] = [
    {
      id: "principal",
      header: "Address",
      cell: () => (
        <div className="flex items-center gap-2 md:w-96 w-64">
          <SkeletonBar className="flex-1 min-w-0" />
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <SkeletonBar className="w-4" />
          </div>
        </div>
      ),
    },
    {
      id: "total",
      header: "Total",
      cell: () => <SkeletonBar className="w-40" />,
      meta: { className: "text-left" },
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
      cell: () => <SkeletonBar className="w-40" />,
      meta: { className: "text-left" },
    },
    {
      id: "ledgerBalance",
      header: "Ledger Balance",
      cell: () => <SkeletonBar className="w-40" />,
      meta: { className: "text-left" },
    },
    {
      id: "weight",
      header: "Weight In Total Supply",
      cell: () => <SkeletonBar className="w-20" />,
      meta: { className: "text-left" },
    },
  ];

  const paginationFooter =
    setPagination ? (
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-[#86858A]">
          <span>Lines per page</span>
          <div className="relative inline-flex items-center gap-[5px] rounded-full bg-white border border-[#E1E1E1] py-[5px] px-[10px] font-medium text-[13px] leading-none text-content">
            <span>{pageSize}</span>
            <svg
              className="pointer-events-none shrink-0"
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.64 2.98328L4.46667 5.15661C4.21 5.41328 3.79 5.41328 3.53333 5.15661L1.36 2.98328"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canPrev && (
            <button
              type="button"
              onClick={() => goToPage(pageIndex - 1)}
              aria-label="Previous page"
              className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full text-[#69737C] hover:bg-[#F1F6F9]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {pageItems.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex items-center justify-center h-7 min-w-7 text-[#69737C]"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => goToPage(item - 1)}
                className={`inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full ${
                  item - 1 === pageIndex
                    ? "bg-[#F1F6F9] text-[#222526]"
                    : "text-[#69737C] hover:bg-[#F1F6F9]"
                }`}
              >
                {item}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => goToPage(pageIndex + 1)}
            disabled={!canNext}
            aria-label="Next page"
            className="inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full text-[#69737C] hover:bg-[#F1F6F9] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 4L10 8L6 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div>
      {isFetchingFetchTokenHolders ? (
        <NewTable
          columns={skeletonColumns}
          data={skeletonRows}
          footer={paginationFooter}
        />
      ) : (
        isSuccessFetchTokenHolders &&
        data && (
          <NewTable
            columns={columns}
            data={data.list.rows}
            footer={paginationFooter}
          />
        )
      )}
      {isErrorFetchTokenHolders && (
        <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
          <div>{errorFetchTokenHolders?.message}</div>
        </div>
      )}
    </div>
  );
};

export default TokenDistributionList;
