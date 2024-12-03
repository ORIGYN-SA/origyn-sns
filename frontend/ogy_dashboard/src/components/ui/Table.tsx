/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ReactNode, useMemo, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
  OnChangeFn,
  SortingState,
  Row,
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

interface ReactTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  rowCount?: number;
  pagination?: PaginationState;
  setPagination?: OnChangeFn<PaginationState>;
  sorting?: SortingState;
  setSorting?: OnChangeFn<SortingState>;
  getRowCanExpand?: (row: Row<T>) => boolean;
  subComponent?: ReactNode;
  identifier?: string;
  showPageSizeOptions?: boolean;
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
  rowCount = data.length,
  pagination,
  setPagination,
  sorting,
  setSorting,
  getRowCanExpand,
  identifier = "",
  subComponent,
  showPageSizeOptions = false,
}: ReactTableProps<T>) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageIndexParam = `page_index${identifier ? `_${identifier}` : ""}`;
  const pageSizeParam = `page_size${identifier ? `_${identifier}` : ""}`;

  const defaultData = useMemo(() => [], []);

  const table = useReactTable({
    data: Array.isArray(data) ? data : (data?.rows ?? defaultData),
    columns,
    rowCount: rowCount,
    state: {
      pagination,
      sorting,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand,
    getExpandedRowModel: getExpandedRowModel(),
    manualPagination: !!setPagination,
    manualSorting: !!setSorting,
  });

  const handleOnChangePageSize = (value: string) => {
    table.setPageSize(Number(value));
    table.setPageIndex(0);
    searchParams.set(pageSizeParam, value);
    searchParams.set(pageIndexParam, "1");
    setSearchParams(searchParams);
  };

  const handleOnClickPreviousPage = () => {
    table.previousPage();
    searchParams.set(
      pageIndexParam,
      (table.getState().pagination.pageIndex + 1).toString()
    );
    setSearchParams(searchParams);
  };

  const handleOnClickNextPage = () => {
    table.nextPage();
    searchParams.set(
      pageIndexParam,
      (table.getState().pagination.pageIndex + 1 + 1).toString()
    );
    setSearchParams(searchParams);
  };

  const handleOnClickFirstPage = () => {
    table.setPageIndex(0);
    searchParams.set(pageIndexParam, "1");
    setSearchParams(searchParams);
  };

  const handleOnClickLastPage = () => {
    table.setPageIndex(table.getPageCount() - 1);
    searchParams.set(pageIndexParam, table.getPageCount().toString());
    setSearchParams(searchParams);
  };

  const handleOnChangeSorting = (columnId: string) => {
    const currentSort = table.getColumn(columnId).getIsSorted();
    const newSortDirection =
      currentSort === "asc" ? "desc" : currentSort === "desc" ? null : "asc";
    setSorting([{ id: columnId, desc: newSortDirection === "desc" }]);
    searchParams.set("id", columnId);
    if (newSortDirection) {
      searchParams.set("desc", newSortDirection === "desc");
    } else {
      searchParams.delete("desc");
    }
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
              <Fragment key={row.id}>
                <tr className="bg-surface border-b last:border-none border-border">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-8 py-4 overflow-hidden text-ellipsis whitespace-nowrap  place-items-center ${
                        cell.column.columnDef.meta?.className ?? "text-center"
                      }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() && (
                  <tr>
                    <td colSpan={row.getVisibleCells().length}>
                      {subComponent && subComponent}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-1 w-full">
        {pagination && setPagination && (
          <div className="flex items-center justify-between p-6">
            {showPageSizeOptions && (
              <div className="flex items-center">
                <span>Lines per page</span>
                <Select
                  options={linesPerPageOptions}
                  value={table.getState().pagination.pageSize}
                  handleOnChange={(value) => handleOnChangePageSize(value)}
                  className="ml-2 w-25"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
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
                  {Math.max(1, table.getPageCount())}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;
