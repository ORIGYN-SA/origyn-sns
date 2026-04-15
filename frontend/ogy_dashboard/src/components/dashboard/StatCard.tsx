import { FC, ReactNode } from "react";
import clsx from "clsx";
import { Card } from "@components/ui";
import Skeleton from "@components/ui/SkeletonShadcn";

type StatCardProps = {
  title?: ReactNode;
  value?: ReactNode;
  unit?: ReactNode;
  accessory?: ReactNode;
  tooltip?: ReactNode;
  underlineColor?: string;
  underlineClassName?: string;
  active?: boolean;
  loading?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
};

const StatCard: FC<StatCardProps> = ({
  title,
  value,
  unit,
  accessory,
  tooltip,
  underlineColor,
  underlineClassName,
  active = false,
  loading = false,
  onMouseEnter,
  onMouseLeave,
  className,
}) => {
  const interactive = Boolean(onMouseEnter || onMouseLeave);

  const renderedAccessory = loading ? (
    <Skeleton className="h-8 w-8 rounded-full" />
  ) : (
    accessory
  );
  const renderedTitle = loading ? <Skeleton className="h-5 w-48" /> : title;
  const renderedValue = loading ? <Skeleton className="h-7 w-32" /> : value;

  return (
    <Card
      className={clsx(
        "bg-surface-2/40 dark:bg-surface-2 pb-8",
        interactive &&
          "dark:hover:bg-white/10 hover:bg-black/5 transition-opacity duration-300",
        active && "dark:bg-white/10 bg-black/5",
        className
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center text-lg font-semibold">
          {renderedAccessory}
          <span
            className={clsx(renderedAccessory && "ml-2", "text-content/60")}
          >
            {renderedTitle}
          </span>
        </div>
        {!loading && tooltip}
      </div>
      <div className="flex items-center mt-4 text-2xl font-semibold">
        <span className="mr-3">{renderedValue}</span>
        {!loading && unit && <span className="text-content/60">{unit}</span>}
      </div>
      <Card.BorderBottom color={underlineColor} className={underlineClassName} />
    </Card>
  );
};

export default StatCard;
