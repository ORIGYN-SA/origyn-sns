import { ReactNode } from "react";

type StatProps = {
  iconSrc?: string;
  value?: ReactNode;
  unit?: string;
  unitClassName?: string;
  loading?: boolean;
  className?: string;
};

const SKEL = "inline-block bg-muted/20 animate-pulse rounded";

const DEFAULT_UNIT_CLASS = "ml-3 font-semibold text-[22px] leading-none";

const Stat = ({
  iconSrc,
  value,
  unit,
  unitClassName = DEFAULT_UNIT_CLASS,
  loading = false,
  className = "",
}: StatProps) => (
  <div
    className={`flex items-baseline min-w-0 h-[28px] ${className}`}
  >
    {iconSrc &&
      (loading ? (
        <span className="w-[25px] h-6 self-center mr-2 shrink-0 rounded-full bg-muted/20 animate-pulse block" />
      ) : (
        <img
          src={iconSrc}
          alt=""
          className="w-[25px] h-6 self-center mr-2 shrink-0"
        />
      ))}
    <span className="font-bold text-[28px] leading-none truncate min-w-0">
      {loading ? <span className={`${SKEL} w-40`}>&nbsp;</span> : value}
    </span>
    {(unit || loading) && (
      <span className={`text-muted shrink-0 ${unitClassName}`}>
        {loading ? <span className={`${SKEL} w-10`}>&nbsp;</span> : unit}
      </span>
    )}
  </div>
);

export default Stat;
