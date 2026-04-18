import { ReactNode } from "react";

type DetailRowProps = {
  label: ReactNode;
  value: ReactNode;
  className?: string;
};

const DetailRow = ({ label, value, className }: DetailRowProps) => (
  <div className={`flex flex-col gap-2 py-4 ${className ?? ""}`}>
    <div className="text-sm font-medium text-muted">{label}</div>
    <div className="flex items-center gap-2 min-w-0">{value}</div>
  </div>
);

export default DetailRow;
