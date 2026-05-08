import { Link } from "react-router-dom";

type BrandLogoProps = {
  className?: string;
  labelClassName?: string;
};

const BrandLogo = ({ className = "", labelClassName = "" }: BrandLogoProps) => {
  return (
    <Link to="/" className={`flex items-center space-x-2 ${className}`}>
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
