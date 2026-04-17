import { useState } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { EyeIcon } from "@heroicons/react/24/outline";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { NewTable, TablePagination, SkeletonOverlay } from "@components/ui";
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
        <button onClick={toggleExpand} className="cursor-pointer mr-2">
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
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
            ? "bg-jade/20 text-jade"
            : "bg-sky/20 text-sky"
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
    cell: (row) => <span>{row.age}</span>,
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
      <div className="flex justify-center items-center shrink-0 rounded-full bg-surface border border-border hover:bg-surface-2 w-10 h-10">
        <button
          onClick={() =>
            navigate({
              pathname: "/governance/neurons/details",
              search: createSearchParams({ id: row.id }).toString(),
            })
          }
        >
          <EyeIcon className="h-5 w-5" />
        </button>
      </div>
    ),
  },
];

const FAKE_ROW: NeuronRow = {
  id: "aaaaa-aaaaa-aaaaa-aaaaa-aaaaa-aaaaa",
  stakedOGY: "1,000,000",
  state: "Active",
  votingPower: "1,250,000",
  dissolveDelay: "2 years",
  age: "6 months ago",
  details: [],
};

const buildSkeletonRows = (count: number): NeuronRow[] =>
  buildFakeRows(FAKE_ROW, count);

const NeuronExpandedRow = ({ row }: { row: NeuronRow }) => (
  <div className="grid grid-cols-1 xl:grid-cols-3">
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

const NeuronsList = ({
  pagination,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagination?: any;
}) => {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(pagination?.pageIndex ?? 0);
  const [pageSize, setPageSize] = useState(pagination?.pageSize ?? 10);

  const { data, isSuccess, isLoading, isError, error } =
    useNeurons({
      limit: pageSize,
      offset: pageSize * pageIndex,
    });

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
    isLoading || !isSuccess || !data
      ? buildSkeletonRows(pageSize)
      : (data.list.rows as NeuronRow[]);

  if (isError) {
    return (
      <div className="flex items-center justify-center h-40 text-red-500 font-semibold">
        <div>{error?.message}</div>
      </div>
    );
  }

  return (
    <div>
      <SkeletonOverlay loading={isLoading}>
        <NewTable
          columns={columns}
          data={rows}
          footer={paginationFooter}
          renderExpanded={(row) => <NeuronExpandedRow row={row} />}
        />
      </SkeletonOverlay>
    </div>
  );
};

export default NeuronsList;
