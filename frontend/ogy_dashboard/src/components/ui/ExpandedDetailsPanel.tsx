import { ReactNode } from "react";

type ExpandedDetail = {
  label: string;
  value: ReactNode;
};

type Columns = 2 | 3 | 4;

type ExpandedDetailsPanelProps = {
  details: ExpandedDetail[];
  columns?: Columns;
  className?: string;
};

const COLUMNS_CLASS: Record<Columns, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 xl:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

const ExpandedDetailsPanel = ({
  details,
  columns = 4,
  className,
}: ExpandedDetailsPanelProps) => (
  <div
    className={`bg-surface-muted/40 px-[70px] py-6 border-t border-border ${className ?? ""}`}
  >
    <div className={`grid grid-cols-1 ${COLUMNS_CLASS[columns]} gap-3`}>
      {details.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl bg-surface border border-border p-4 min-w-0"
        >
          <div className="text-xs font-medium text-muted uppercase tracking-wide">
            {label}
          </div>
          <div className="mt-2 text-lg font-medium text-content break-words min-w-0">
            {value}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ExpandedDetailsPanel;
