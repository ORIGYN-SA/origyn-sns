import { Link } from "react-router-dom";
import { useLocalePath } from "@i18n/LocaleContext";

type BrandLogoProps = {
  className?: string;
  labelClassName?: string;
};

const BrandLogo = ({ className = "", labelClassName = "" }: BrandLogoProps) => {
  const lp = useLocalePath();
  return (
    <Link
      to={lp("/")}
      // Fixed latin brand lockup — keep logo-then-wordmark order in every
      // locale (don't let RTL flip the wordmark to the icon's left).
      dir="ltr"
      className={`flex items-center gap-2 ${className}`}
    >
      <img
        src="/ogy_logo.svg"
        alt=""
        width={32}
        height={31}
        className="w-8 h-8 shrink-0"
      />
      <span
        className={`self-center font-bold text-[20px] leading-none tracking-[-0.03em] text-current whitespace-nowrap ${labelClassName}`}
      >
        OGY Dashboard
      </span>
    </Link>
  );
};

export default BrandLogo;
