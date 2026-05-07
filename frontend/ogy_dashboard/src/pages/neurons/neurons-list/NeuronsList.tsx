import { useState } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { EyeIcon } from "@heroicons/react/24/outline";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
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
import useNeurons from "@hooks/neurons/useNeuronsAll";

type NeuronRow = {
  id: string;
  stakedOGY: string;
  state: string;
  votingPower: string;
  dissolveDelay: string;
  age: string;
  createdAt: string;
  createdAtRaw: number;
  details: { label: string; value: string }[];
};

const getColumns = (
  navigate: (opts: { pathname: string; search: string }) => void
): NewTableColumn<NeuronRow>[] => [
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
        <span className="truncate min-w-0 max-w-[200px]">{row.id}</span>
        <CopyToClipboard value={row.id} />
      </div>
    ),
  },
  {
    id: "state",
    header: "State",
    cell: (row) => (
      <span
        className={`inline-block text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
          row.state === "Dissolved"
            ? "border border-sky/25 bg-sky/10 text-sky-700 dark:text-sky-300"
            : "border border-jade/25 bg-jade/10 text-emerald-700 dark:text-emerald-300"
        }`}
      >
        {row.state}
      </span>
    ),
  },
  {
    id: "stakedOGY",
    header: "Staked OGY",
    cell: (row) => <span>{row.stakedOGY}</span>,
  },
  {
    id: "dissolveDelay",
    header: "Dissolve Delay",
    cell: (row) => <span>{row.dissolveDelay}</span>,
  },
  {
    id: "age",
    header: "Age",
    cell: (row) =>
      row.createdAtRaw ? (
        <DatePill millis={row.createdAtRaw * 1000} />
      ) : (
        <span>{row.age}</span>
      ),
  },
  {
    id: "votingPower",
    header: "Voting Power",
    cell: (row) => <span>{row.votingPower}</span>,
  },
  {
    id: "view",
    header: "View",
    cell: (row) => (
      <button
        type="button"
        aria-label={`View neuron ${row.id}`}
        onClick={() =>
          navigate({
            pathname: "/governance/neurons/details",
            search: createSearchParams({ id: row.id }).toString(),
          })
        }
        className="inline-flex justify-center items-center shrink-0 rounded-full bg-surface border border-border hover:bg-surface-2 w-10 h-10 cursor-pointer transition-colors"
      >
        <EyeIcon className="h-5 w-5" />
      </button>
    ),
  },
];

const FAKE_ROW: NeuronRow = {
  id: "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa",
  stakedOGY: "1,000,000",
  state: "Not dissolving",
  votingPower: "1,250,000",
  dissolveDelay: "2 years",
  age: "6 months ago",
  createdAt: "2024-01-01",
  createdAtRaw: 0,
  details: [],
};

const buildSkeletonRows = (count: number): NeuronRow[] =>
  buildFakeRows(FAKE_ROW, count);

const NeuronsList = ({
  pagination,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagination?: any;
}) => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(pagination?.pageIndex ?? 0);
  const [pageSize, setPageSize] = useState(pagination?.pageSize ?? 10);

  const { data, isSuccess, isLoading, isError } = useNeurons({
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
      : (data.list.rows as NeuronRow[]);

  return (
    <div className="relative">
      <SkeletonOverlay loading={showSkeleton}>
        {hasError && <CardErrorOverlay title="Neurons" />}
        <NewTable
          columns={columns}
          data={rows}
          footer={paginationFooter}
          getRowId={(row) => row.id}
          renderExpanded={(row) => (
            <ExpandedDetailsPanel details={row.details} columns={3} />
          )}
        />
      </SkeletonOverlay>
    </div>
  );
};

export default NeuronsList;
