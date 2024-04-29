/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
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
} from "@tanstack/react-table";
import { Select } from "@components/ui";

interface ReactTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination: PaginationState;
  setPagination: OnChangeFn<PaginationState>;
  enablePagination: boolean;
  // Useful if using two or more table on same page
  pageIndexIdentifier: string;
  pageSizeIdentifier: string;
  sorting: SortingState;
  setSorting: OnChangeFn<SortingState>;
}

const linesPerPageOptions = [
  { value: 10 },
  { value: 20 },
  { value: 50 },
  { value: 100 },
];

const Table = <T extends object>({
  columns,
  pagination,
  setPagination,
  data,
  enablePagination = true,
  pageIndexIdentifier = "pageIndex",
  pageSizeIdentifier = "pageSize",
  sorting,
  setSorting,
}: ReactTableProps<T>) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultData = useMemo(() => [], []);

  const table = useReactTable({
    data: data?.rows ?? defaultData,
    columns,
    rowCount: data?.rowCount ?? 0,
    state: {
      pagination,
      sorting,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const handleOnChangePageSize = (value: string) => {
    table.setPageSize(Number(value));
    table.setPageIndex(0);
    searchParams.set(pageSizeIdentifier, value);
    searchParams.set(pageIndexIdentifier, "1");
    setSearchParams(searchParams);
  };

  // const handleOnChangePageIndex = (e) => {
  //   const page = e.target.value ? Number(e.target.value) - 1 : 0;
  //   table.setPageIndex(page);
  //   searchParams.set("pageIndex", (page + 1).toString());
  //   setSearchParams(searchParams);
  // };

  const handleOnClickPreviousPage = () => {
    table.previousPage();
    searchParams.set(
      pageIndexIdentifier,
      table.getState().pagination.pageIndex.toString()
    );
    setSearchParams(searchParams);
  };

  const handleOnClickNextPage = () => {
    table.nextPage();
    searchParams.set(
      pageIndexIdentifier,
      (table.getState().pagination.pageIndex + 2).toString()
    );
    setSearchParams(searchParams);
  };

  const handleOnClickFirstPage = () => {
    table.firstPage();
    searchParams.set(pageIndexIdentifier, "1");
    setSearchParams(searchParams);
  };

  const handleOnClickLastPage = () => {
    table.lastPage();
    searchParams.set(pageIndexIdentifier, table.getPageCount().toString());
    setSearchParams(searchParams);
  };

  const handleOnChangeSorting = (columnId: string) => {
    // Detect the current sorting state of the column
    const currentSort = table.getColumn(columnId).getIsSorted();
    const newSortDirection =
      currentSort === "asc" ? "desc" : currentSort === "desc" ? null : "asc";
    setSorting([{ id: columnId, desc: newSortDirection === "desc" }]);
    searchParams.set("id", columnId);
    searchParams.set("desc", newSortDirection === "desc");
    setSearchParams(searchParams);
  };

  // useEffect(() => {
  //   searchParams.set(
  //     pageIndexIdentifier,
  //     (table.getState().pagination.pageIndex + 1).toString()
  //   );
  //   setSearchParams(searchParams);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [pagination.pageSize]);

  return (
    <div className="bg-surface border border-border rounded-xl">
      <div className="overflow-x-auto">
        <table className="table-auto w-full rounded-xl">
          <thead className="bg-charcoal dark:bg-surface text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className="py-4 px-8 first:rounded-tl-lg last:rounded-tr-lg font-normal"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`${
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          } ${
                            header.column.columnDef.meta?.className ??
                            "text-center"
                          }`}
                          onClick={() => handleOnChangeSorting(header.id)}
                          title={
                            header.column.getCanSort()
                              ? header.column.getNextSortingOrder() === "asc"
                                ? "Sort ascending"
                                : header.column.getNextSortingOrder() === "desc"
                                ? "Sort descending"
                                : "Clear sort"
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: " 🔼",
                            desc: " 🔽",
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>

                        // <div
                        //   className={
                        //     header.column.columnDef.meta?.className ??
                        //     "text-center"
                        //   }
                        // >
                        //   {flexRender(
                        //     header.column.columnDef.header,
                        //     header.getContext()
                        //   )}
                        // </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              return (
                <tr
                  key={row.id}
                  className="bg-surface border-b last:border-none border-border"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        className={`px-8 py-4 whitespace-normal break-words ${
                          cell.column.columnDef.meta?.className ?? "text-center"
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-1 w-full">
        {enablePagination && (
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center">
              <span>Lines per page</span>
              <Select
                options={linesPerPageOptions}
                value={table.getState().pagination.pageSize}
                handleOnChange={(value) => handleOnChangePageSize(value)}
                className="ml-2 w-25"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="border rounded p-1"
                onClick={handleOnClickFirstPage}
                disabled={!table.getCanPreviousPage()}
              >
                {"<<"}
              </button>
              <button
                className="border rounded p-1"
                onClick={handleOnClickPreviousPage}
                disabled={!table.getCanPreviousPage()}
              >
                {"<"}
              </button>
              <button
                className="border rounded p-1"
                onClick={handleOnClickNextPage}
                disabled={!table.getCanNextPage()}
              >
                {">"}
              </button>
              <button
                className="border rounded p-1"
                onClick={handleOnClickLastPage}
                disabled={!table.getCanNextPage()}
              >
                {">>"}
              </button>
              <span className="flex items-center gap-1">
                <div>Page</div>
                <strong>
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount().toLocaleString()}
                </strong>
              </span>
              {/* <span className="flex items-center gap-1">
            | Go to page:
            <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                handleOnChangePageIndex(e);
              }}
              className="border p-1 rounded w-16"
            />
          </span> */}

              {/* <select
        value={table.getState().pagination.pageSize}
        onChange={(e) => {
          table.setPageSize(Number(e.target.value));
        }}
      >
        {[10, 20, 30, 40, 50].map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            Show {pageSize}
          </option>
        ))}
      </select> */}

              {data.isFetching ? "Loading..." : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;
