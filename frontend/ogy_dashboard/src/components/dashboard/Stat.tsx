import { ReactNode } from "react";

type StatProps = {
  iconSrc?: string;
  value: ReactNode;
  unit?: string;
  className?: string;
};

const Stat = ({ iconSrc, value, unit, className = "" }: StatProps) => (
  <div className={`flex items-baseline w-full min-w-0 ${className}`}>
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
      <span className="ml-3 font-semibold text-[22px] leading-none text-muted shrink-0">
        {unit}
      </span>
    )}
  </div>
);

export default Stat;
