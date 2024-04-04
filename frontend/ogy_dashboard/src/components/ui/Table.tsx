import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { Select } from "@components/ui";

interface ReactTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination: PaginationState;
  setPagination: OnChangeFn<PaginationState>;
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
}: ReactTableProps<T>) => {
  const defaultData = useMemo(() => [], []);

  const table = useReactTable({
    data: data.data?.rows ?? defaultData,
    columns,
    // pageCount: data.data?.pageCount ?? -1,
    rowCount: data.data?.rowCount,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="bg-surface shadow-md rounded-lg">
      <div className="overflow-x-auto">
        <table className="table-auto w-full">
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
                          className={
                            header.column.columnDef.meta?.className ??
                            "text-center"
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
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
                <tr key={row.id} className="bg-surface border border-surface-2">
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td
                        key={cell.id}
                        className={`px-8 py-4 ${
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

      <div className="flex items-center justify-between w-full mt-4 px-8 pt-4 pb-8">
        <div className="flex items-center">
          <span>Lines per page</span>
          <Select
            options={linesPerPageOptions}
            value={table.getState().pagination.pageSize}
            handleOnChange={(value) => table.setPageSize(value)}
            className="ml-2 w-25"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="border rounded p-1"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {"<"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {">"}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.lastPage()}
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
          <span className="flex items-center gap-1">
            | Go to page:
            <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className="border p-1 rounded w-16"
            />
          </span>

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
    </div>
  );
};

export default Table;
