import { FC, ReactNode } from "react";
import clsx from "clsx";
import { Card } from "@components/ui";
import Stat from "./Stat";

type StatCardProps = {
  title?: ReactNode;
  value?: string;
  unit?: string;
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
      <div data-skel-static className="flex items-center justify-between">
        <div className="flex items-center text-[16px] font-medium leading-none">
          {accessory}
          <span className={clsx(accessory && "ms-2", "text-muted")}>
            {title}
          </span>
        </div>
        {tooltip}
      </div>
      <div className="mt-4">
        <Stat
          value={value}
          unit={unit}
          unitClassName="ml-1 font-light text-[16px] leading-6"
          loading={loading}
        />
      </div>
      <Card.BorderBottom
        color={underlineColor}
        className={underlineClassName}
      />
    </Card>
  );
};

export default StatCard;
