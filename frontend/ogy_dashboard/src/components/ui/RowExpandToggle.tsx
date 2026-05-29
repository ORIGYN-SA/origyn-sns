import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { useT } from "@i18n/LocaleContext";

type RowExpandToggleProps = {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
};

const RowExpandToggle = ({
  isExpanded,
  onToggle,
  className,
}: RowExpandToggleProps) => {
  const t = useT();
  return (
  <button
    type="button"
    onClick={onToggle}
    aria-label={isExpanded ? t("ui.collapseRow") : t("ui.expandRow")}
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
};

export default RowExpandToggle;
