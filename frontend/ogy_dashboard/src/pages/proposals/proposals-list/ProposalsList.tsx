import { ReactNode, useState } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { EyeIcon } from "@heroicons/react/24/outline";
import { NewTable, TablePagination, SkeletonOverlay } from "@components/ui";
import { CardErrorOverlay } from "@components/dashboard";
import { NewTableColumn } from "@components/ui/NewTable";
import { buildFakeRows } from "@helpers/skeleton/fakeData";
import useProposals from "@hooks/proposals/useProposalsAll";
import { getColorByProposalStatus } from "@helpers/colors/getColorByProposalStatus";

type ProposalRow = {
  id: number;
  title: string;
  proposed: string;
  timeRemaining: string;
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
        <button onClick={toggleExpand} className="cursor-pointer mr-2">
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
        <div className="flex items-center max-w-sm">
          <div className="mr-2 truncate">{row.id}</div>
        </div>
      </div>
    ),
  },
  {
    id: "title",
    header: "Title",
    cell: (row) => (
      <div className="max-w-64 truncate font-semibold">{row.title}</div>
    ),
  },
  {
    id: "proposed",
    header: "Proposed",
    cell: (row) => <span>{row.proposed}</span>,
  },
  {
    id: "timeRemaining",
    header: "Time Remaining",
    cell: (row) => <div className="font-semibold">{row.timeRemaining}</div>,
  },
  {
    id: "topic",
    header: "Topic",
    cell: (row) => (
      <span className="inline-block bg-spacePurple/20 text-spacePurple text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
        {row.topic}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <span
        className={`inline-block text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${getColorByProposalStatus(row.status, "bg")} ${getColorByProposalStatus(row.status, "text")}`}
      >
        {row.status}
      </span>
    ),
  },
  {
    id: "view",
    header: "View",
    cell: (row) => (
      <div className="flex justify-center items-center shrink-0 rounded-full bg-surface border border-border hover:bg-surface-2 w-10 h-10">
        <button
          onClick={() =>
            navigate({
              pathname: "/proposals/details",
              search: createSearchParams({ id: String(row.id) }).toString(),
            })
          }
        >
          <EyeIcon className="h-5 w-5" />
        </button>
      </div>
    ),
  },
];

const FAKE_ROW: ProposalRow = {
  id: 12345,
  title: "Proposal title placeholder",
  proposed: "2024-01-01",
  timeRemaining: "3 days",
  topic: "Governance",
  status: "Open",
  details: [],
};

const buildSkeletonRows = (count: number): ProposalRow[] =>
  buildFakeRows(FAKE_ROW, count);

const ProposalExpandedRow = ({ row }: { row: ProposalRow }) => (
  <div className="grid grid-cols-1 xl:grid-cols-4 gap-0">
    {row.details.map(({ label, value }) => (
      <div
        key={label}
        className="text-center p-4 border-r last:border-r-0 border-b border-border"
      >
        <div className="text-content/60">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    ))}
  </div>
);

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
          renderExpanded={(row) => <ProposalExpandedRow row={row} />}
        />
      </SkeletonOverlay>
    </div>
  );
};

export default ProposalsList;
