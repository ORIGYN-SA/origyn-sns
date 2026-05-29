import { ReactNode } from "react";
import { InboxIcon } from "@heroicons/react/24/outline";
import { useT } from "@i18n/LocaleContext";

type ChartEmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
};

const ChartEmptyState = ({ title, description }: ChartEmptyStateProps) => {
  const t = useT();
  const resolvedDescription = description ?? t("dashboard.emptyState.description");
  return (
    <div
      role="status"
      className="flex h-full w-full items-center justify-center px-6"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 border border-border">
          <InboxIcon className="w-6 h-6 text-muted" />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-content text-base">
            {t("dashboard.emptyState.noDataFor")}{" "}
            <strong className="font-bold">{title}</strong>
          </h4>
          <p className="text-sm text-muted">{resolvedDescription}</p>
        </div>
      </div>
    </div>
  );
};

export default ChartEmptyState;
