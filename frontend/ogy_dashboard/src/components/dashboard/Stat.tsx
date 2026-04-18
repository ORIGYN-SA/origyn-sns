import { ReactNode } from "react";

type StatProps = {
  iconSrc?: string;
  value?: ReactNode;
  unit?: string;
  unitClassName?: string;
  loading?: boolean;
  className?: string;
};

const DEFAULT_UNIT_CLASS = "ml-3 font-semibold text-[22px] leading-none";

const Stat = ({
  iconSrc,
  value,
  unit,
  unitClassName = DEFAULT_UNIT_CLASS,
  loading = false,
  className = "",
}: StatProps) => {
  const isLoadingValue = loading;

  return (
    <div className={`flex items-baseline min-w-0 h-[28px] ${className}`}>
      {iconSrc && (
        <img
          src={iconSrc}
          alt=""
          className="w-[25px] h-6 self-center mr-2 shrink-0"
        />
      )}
      {isLoadingValue ? (
        <div
          data-skel-block
          className="h-7 w-[200px] shrink-0 self-center rounded-md"
        />
      ) : (
        <>
          <span className="font-bold text-[28px] leading-none truncate min-w-0">
            {value}
          </span>
          {unit && (
            <span className={`text-muted shrink-0 ${unitClassName}`}>
              {unit}
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default Stat;
