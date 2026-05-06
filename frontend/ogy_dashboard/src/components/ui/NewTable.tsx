import {
  Fragment,
  ReactNode,
  useState,
  useCallback,
  useMemo,
} from "react";

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
  getRowId?: (row: T, index: number) => string | number;
};

const NewTable = <T,>({
  columns,
  data,
  className,
  footer,
  renderExpanded,
  getRowId,
}: NewTableProps<T>) => {
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());

  const getRowKey = useCallback(
    (row: T, index: number) => String(getRowId ? getRowId(row, index) : index),
    [getRowId]
  );

  const validIds = useMemo(
    () => new Set(data.map((row, index) => getRowKey(row, index))),
    [data, getRowKey]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
                    index === 0 ? "pl-16" : "pl-4"
                  } ${index === columns.length - 1 ? "pr-16" : ""} ${
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
              const rowId = getRowKey(row, rowIndex);
              const isExpanded =
                expandedSet.has(rowId) && validIds.has(rowId);
              return (
                <Fragment key={rowId}>
                  <tr
                    className={
                      rowIndex % 2 === 1 ? "bg-surface-muted" : "bg-surface-1"
                    }
                  >
                    {columns.map((column, index) => (
                      <td
                        key={column.id}
                        className={`py-4 text-left border-b border-border ${
                          index === 0 ? "pl-16" : "pl-4"
                        } ${index === columns.length - 1 ? "pr-16" : ""} ${
                          column.cellClassName ?? ""
                        }`}
                      >
                        {column.cell(row, {
                          isExpanded,
                          toggleExpand: () => toggleExpand(rowId),
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
      {footer && (
        <div data-skel-static className="px-16 py-5">
          {footer}
        </div>
      )}
    </div>
  );
};

export default NewTable;
