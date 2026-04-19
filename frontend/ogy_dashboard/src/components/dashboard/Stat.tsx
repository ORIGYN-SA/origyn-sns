import { ReactNode } from "react";

type StatSize = "default" | "hero";

type StatProps = {
  iconSrc?: string;
  value?: ReactNode;
  unit?: string;
  unitClassName?: string;
  loading?: boolean;
  className?: string;
  size?: StatSize;
};

const Stat = ({
  iconSrc,
  value,
  unit,
  unitClassName,
  loading = false,
  className = "",
  size = "default",
}: StatProps) => {
  const isHero = size === "hero";

  const wrapperHeight = isHero ? "h-10" : "h-[28px]";
  const iconClass = isHero
    ? "h-8 w-8 self-center mr-3 shrink-0"
    : "w-[25px] h-6 self-center mr-2 shrink-0";
  const skelClass = isHero
    ? "h-8 w-[180px] self-center shrink-0 rounded-md"
    : "h-6 w-[200px] self-center shrink-0 rounded-md";
  const valueClass = isHero
    ? "font-bold leading-none truncate min-w-0 text-[40px]"
    : "font-bold leading-none truncate min-w-0 text-[28px]";
  const defaultUnitClass = isHero
    ? "ml-2 font-bold text-[28px] leading-none"
    : "ml-1 font-semibold text-[22px] leading-none";

  return (
    <div
      className={`flex ${loading ? "items-center" : "items-baseline"} min-w-0 ${wrapperHeight} ${className}`}
    >
      {iconSrc && <img src={iconSrc} alt="" className={iconClass} />}
      {loading ? (
        <div data-skel-block className={skelClass} />
      ) : (
        <>
          <span className={valueClass}>{value}</span>
          {unit && (
            <span
              className={`text-muted shrink-0 ${unitClassName ?? defaultUnitClass}`}
            >
              {unit}
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default Stat;
