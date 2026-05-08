import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
  OnChangeFn,
  SortingState,
  RowData,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { Select } from "@components/ui";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

export type TableData<T> =
  | T[]
  | {
      rows: T[];
      rowCount?: number;
      pageCount?: number;
      isFetching?: boolean;
    };

interface ReactTableProps<T extends object> {
  data: TableData<T>;
  columns: ColumnDef<T>[];
  pagination?: PaginationState;
  setPagination?: OnChangeFn<PaginationState>;
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  identifier?: string;
}

const linesPerPageOptions = [
  { value: 10 },
  { value: 20 },
  { value: 50 },
  { value: 100 },
];

const Table = <T extends object>({
  columns,
  data,
  pagination,
  setPagination,
  sorting,
  setSorting,
  identifier = "",
}: ReactTableProps<T>) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageIndex = `page_index${identifier ? `_${identifier}` : ""}`;
  const pageSize = `page_size${identifier ? `_${identifier}` : ""}`;

  const defaultData = useMemo<T[]>(() => [], []);

  const rows = Array.isArray(data) ? data : (data?.rows ?? defaultData);
  const rowCount = Array.isArray(data) ? data.length : (data?.rowCount ?? 0);
  const isFetching = Array.isArray(data) ? false : (data?.isFetching ?? false);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      pagination,
      sorting,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    rowCount,
    manualPagination: setPagination ? true : undefined,
    manualSorting: setSorting ? true : undefined,
  });

  const handleOnChangePageSize = (value: string | number) => {
    const next = Number(value);
    table.setPageSize(next);
    table.setPageIndex(0);
    searchParams.set(pageSize, String(next));
    searchParams.set(pageIndex, "1");
    setSearchParams(searchParams);
  };

  const handleOnClickPreviousPage = () => {
    table.previousPage();
    searchParams.set(
      pageIndex,
      table.getState().pagination.pageIndex.toString()
    );
    setSearchParams(searchParams);
  };

  const handleOnClickNextPage = () => {
    table.nextPage();
    searchParams.set(
      pageIndex,
      (table.getState().pagination.pageIndex + 2).toString()
    );
    setSearchParams(searchParams);
  };

  const handleOnClickFirstPage = () => {
    table.firstPage();
    searchParams.set(pageIndex, "1");
    setSearchParams(searchParams);
  };

  const handleOnClickLastPage = () => {
    table.lastPage();
    searchParams.set(pageIndex, table.getPageCount().toString());
    setSearchParams(searchParams);
  };

  const handleOnChangeSorting = (columnId: string) => {
    if (!setSorting) return;
    const column = table.getColumn(columnId);
    if (!column) return;
    const currentSort = column.getIsSorted();
    const newSortDirection =
      currentSort === "asc" ? "desc" : currentSort === "desc" ? null : "asc";
    setSorting([{ id: columnId, desc: newSortDirection === "desc" }]);
    searchParams.set("id", columnId);
    searchParams.set("desc", String(newSortDirection === "desc"));
    setSearchParams(searchParams);
  };

  return (
    <div className="bg-surface border border-border rounded-xl">
      <div className="overflow-x-auto w-full">
        <table className="table-auto w-full rounded-xl">
          <thead className="bg-charcoal dark:bg-surface-2 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="py-4 px-8 first:rounded-tl-lg last:rounded-tr-lg font-normal"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center ${
                          setSorting && header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        } ${
                          header.column.columnDef.meta?.className ??
                          "justify-center"
                        }`}
                        onClick={
                          setSorting && header.column.getCanSort()
                            ? () => handleOnChangeSorting(header.id)
                            : undefined
                        }
                        title={
                          setSorting && header.column.getCanSort()
                            ? header.column.getNextSortingOrder() === "asc"
                              ? "Sort ascending"
                              : "Sort descending"
                            : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ArrowUpIcon className="h-5 w-5 ml-2" />,
                          desc: <ArrowDownIcon className="h-5 w-5 ml-2" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="bg-surface border-b last:border-none border-border"
              >
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={`px-8 py-4 overflow-hidden text-ellipsis whitespace-nowrap ${
                      index === 0 ? "" : "place-items-center"
                    } ${
                      cell.column.columnDef.meta?.className ?? "text-center"
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-1 w-full">
        {pagination && setPagination && (
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center justify-center whitespace-nowrap sm:justify-start">
              <span className="shrink-0">Lines per page</span>
              <Select
                options={linesPerPageOptions}
                value={table.getState().pagination.pageSize}
                handleOnChange={(value) => handleOnChangePageSize(value)}
                className="ml-2 w-25 shrink-0"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              <button
                className="p-1"
                onClick={handleOnClickFirstPage}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronDoubleLeftIcon className="h-5 w-5" />
              </button>
              <button
                className="p-1"
                onClick={handleOnClickPreviousPage}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                className="p-1"
                onClick={handleOnClickNextPage}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              <button
                className="p-1"
                onClick={handleOnClickLastPage}
                disabled={!table.getCanNextPage()}
              >
                <ChevronDoubleRightIcon className="h-5 w-5" />
              </button>
              <span className="flex items-center gap-1">
                <div>Page</div>
                <strong>
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount().toLocaleString()}
                </strong>
              </span>
              {isFetching ? "Loading..." : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;
