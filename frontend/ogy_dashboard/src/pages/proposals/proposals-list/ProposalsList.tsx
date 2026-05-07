import { ReactNode, useState } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { EyeIcon } from "@heroicons/react/24/outline";
import {
  NewTable,
  TablePagination,
  SkeletonOverlay,
  DatePill,
  ExpandedDetailsPanel,
  RowExpandToggle,
} from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import { NewTableColumn } from "@components/ui/NewTable";
import { buildFakeRows } from "@helpers/skeleton/fakeData";
import useProposals from "@hooks/proposals/useProposalsAll";
import { getColorByProposalStatus } from "@helpers/colors/getColorByProposalStatus";

type ProposalRow = {
  id: number;
  title: string;
  proposed: string;
  proposedRaw: number;
  timeRemaining: string;
  timeRemainingRaw: number;
  topic: string;
  status: string;
  details: { label: string; value: ReactNode }[];
};

const getColumns = (
  navigate: (opts: { pathname: string; search: string }) => void
): NewTableColumn<ProposalRow>[] => [
  {
    id: "id",
    header: "ID",
    cell: (row, { isExpanded, toggleExpand }) => (
      <div className="flex items-center">
        <RowExpandToggle
          isExpanded={isExpanded}
          onToggle={toggleExpand}
          className="mr-2"
        />
        <div className="truncate">{row.id}</div>
      </div>
    ),
  },
  {
    id: "title",
    header: "Title",
    cell: (row) => (
      <div className="max-w-64 truncate">
        <span className="font-medium">{row.title}</span>
      </div>
    ),
  },
  {
    id: "proposed",
    header: "Proposed",
    cell: (row) =>
      row.proposedRaw ? (
        <DatePill millis={row.proposedRaw * 1000} />
      ) : (
        <span>{row.proposed}</span>
      ),
  },
  {
    id: "timeRemaining",
    header: "Time Remaining",
    cell: (row) =>
      row.timeRemainingRaw ? (
        <DatePill millis={row.timeRemainingRaw * 1000} />
      ) : (
        <span className="font-semibold">{row.timeRemaining}</span>
      ),
  },
  {
    id: "topic",
    header: "Topic",
    cell: (row) => (
      <span className="inline-block rounded-full border border-spacePurple/25 bg-spacePurple/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300 whitespace-nowrap">
        {row.topic}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <span
        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${getColorByProposalStatus(row.status, "bg")} ${getColorByProposalStatus(row.status, "text")}`}
      >
        {row.status}
      </span>
    ),
  },
  {
    id: "view",
    header: "View",
    cell: (row) => (
      <button
        type="button"
        aria-label={`View proposal ${row.id}`}
        onClick={() =>
          navigate({
            pathname: "/proposals/details",
            search: createSearchParams({ id: String(row.id) }).toString(),
          })
        }
        className="inline-flex justify-center items-center shrink-0 rounded-full bg-surface border border-border hover:bg-surface-2 w-10 h-10 cursor-pointer transition-colors"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
    ),
  },
];

const FAKE_ROW: ProposalRow = {
  id: 12345,
  title: "Proposal title placeholder",
  proposed: "2024-01-01",
  proposedRaw: 0,
  timeRemaining: "3 days",
  timeRemainingRaw: 0,
  topic: "Governance",
  status: "Open",
  details: [],
};

const buildSkeletonRows = (count: number): ProposalRow[] =>
  buildFakeRows(FAKE_ROW, count);

const ProposalsList = ({
  pagination,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagination?: any;
}) => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(pagination?.pageIndex ?? 0);
  const [pageSize, setPageSize] = useState(pagination?.pageSize ?? 10);

  const { data, isSuccess, isLoading, isError } = useProposals({
    limit: pageSize,
    offset: pageSize * pageIndex,
  });

  const hasError = !isLoading && isError;
  const showSkeleton = isLoading || hasError;
  const columns = getColumns(navigate);
  const pageCount = data?.list.pageCount ?? 0;

  const goToPage = (next: number) => setPageIndex(next);
  const handlePageSizeChange = (next: number) => {
    setPageSize(next);
    setPageIndex(0);
  };

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
    showSkeleton || !isSuccess || !data
      ? buildSkeletonRows(pageSize)
      : (data.list.rows as ProposalRow[]);

  return (
    <div className="relative">
      <SkeletonOverlay loading={showSkeleton}>
        {hasError && <CardErrorOverlay title="Proposals" />}
        <NewTable
          columns={columns}
          data={rows}
          footer={paginationFooter}
          getRowId={(row) => row.id}
          renderExpanded={(row) => (
            <ExpandedDetailsPanel details={row.details} columns={4} />
          )}
        />
      </SkeletonOverlay>
    </div>
  );
};

export default ProposalsList;
