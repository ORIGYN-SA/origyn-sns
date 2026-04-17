import { Fragment, ReactNode, useState, useCallback } from "react";

export const SkeletonBar = ({ className = "" }: { className?: string }) => (
  <span
    className={`block h-6 rounded bg-muted/20 animate-pulse ${className}`}
  />
);

export type NewTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T, meta: { isExpanded: boolean; toggleExpand: () => void }) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

type NewTableProps<T> = {
  columns: NewTableColumn<T>[];
  data: T[];
  className?: string;
  footer?: ReactNode;
  renderExpanded?: (row: T) => ReactNode;
};

const NewTable = <T,>({
  columns,
  data,
  className,
  footer,
  renderExpanded,
}: NewTableProps<T>) => {
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());

  const toggleExpand = useCallback((index: number) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
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
                  className={`py-5 text-left font-semibold whitespace-nowrap ${
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
            {data.map((row, rowIndex) => {
              const isExpanded = expandedSet.has(rowIndex);
              return (
                <Fragment key={rowIndex}>
                  <tr
                    style={{
                      backgroundColor:
                        rowIndex % 2 === 1 ? "#FCFDFF" : "#FFFFFF",
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
                        {column.cell(row, {
                          isExpanded,
                          toggleExpand: () => toggleExpand(rowIndex),
                        })}
                      </td>
                    ))}
                  </tr>
                  {renderExpanded && isExpanded && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="border-b border-border p-0"
                      >
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {footer && <div className="px-[70px] py-5">{footer}</div>}
    </div>
  );
};

export const TableSkeleton = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`pointer-events-none select-none [&_tbody_*]:!text-transparent [&_tbody_strong]:!text-inherit [&_tbody_svg]:!opacity-0 [&_tbody_button]:!bg-muted/20 [&_tbody_button]:!rounded [&_tbody_span]:!bg-muted/20 [&_tbody_span]:!rounded [&_tbody_td]:animate-pulse ${className ?? ""}`}
  >
    {children}
  </div>
);

export default NewTable;
