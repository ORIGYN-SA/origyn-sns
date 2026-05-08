import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";

type RowExpandToggleProps = {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
};

const RowExpandToggle = ({
  isExpanded,
  onToggle,
  className,
}: RowExpandToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={isExpanded ? "Collapse row" : "Expand row"}
    aria-expanded={isExpanded}
    className={`inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-surface-2 transition-colors cursor-pointer ${className ?? ""}`}
  >
    {isExpanded ? (
      <ChevronUpIcon className="h-5 w-5" />
    ) : (
      <ChevronDownIcon className="h-5 w-5" />
    )}
  </button>
);

export default RowExpandToggle;
