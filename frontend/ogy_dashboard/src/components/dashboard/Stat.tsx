import { ReactNode } from "react";

type StatProps = {
  iconSrc?: string;
  value?: ReactNode;
  unit?: string;
  unitClassName?: string;
  className?: string;
};

const DEFAULT_UNIT_CLASS = "ml-3 font-semibold text-[22px] leading-none";

const Stat = ({
  iconSrc,
  value,
  unit,
  unitClassName = DEFAULT_UNIT_CLASS,
  className = "",
}: StatProps) => (
  <div className={`flex items-baseline min-w-0 h-[28px] ${className}`}>
    {iconSrc && (
      <img
        src={iconSrc}
        alt=""
        className="w-[25px] h-6 self-center mr-2 shrink-0"
      />
    )}
    <span className="font-bold text-[28px] leading-none truncate min-w-0">
      {value}
    </span>
    {unit && (
      <span className={`text-muted shrink-0 ${unitClassName}`}>{unit}</span>
    )}
  </div>
);

export default Stat;
