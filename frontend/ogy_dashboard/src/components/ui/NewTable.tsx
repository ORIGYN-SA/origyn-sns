import { ReactNode } from "react";

export type NewTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

type NewTableProps<T> = {
  columns: NewTableColumn<T>[];
  data: T[];
  className?: string;
  footer?: ReactNode;
};

const NewTable = <T,>({
  columns,
  data,
  className,
  footer,
}: NewTableProps<T>) => (
  <div
    className={`bg-surface border border-border rounded-[25px] overflow-hidden ${
      className ?? ""
    }`}
  >
    <div className="overflow-x-auto w-full">
      <table className="table-auto w-full border-separate border-spacing-0">
        <thead className="bg-charcoal text-white">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.id}
                className={`py-5 text-left font-normal ${
                  index === 0 ? "pl-[70px]" : "pl-4"
                } ${index === columns.length - 1 ? "pr-[70px]" : ""} ${
                  column.headerClassName ?? ""
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                backgroundColor: rowIndex % 2 === 1 ? "#FCFDFF" : "#FFFFFF",
              }}
            >
              {columns.map((column, index) => (
                <td
                  key={column.id}
                  className={`py-4 text-left border-b border-border ${
                    index === 0 ? "pl-[70px]" : "pl-4"
                  } ${index === columns.length - 1 ? "pr-[70px]" : ""} ${
                    column.cellClassName ?? ""
                  }`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {footer && <div className="px-[70px] py-5">{footer}</div>}
  </div>
);

export default NewTable;
