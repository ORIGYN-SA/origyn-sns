import { ReactNode } from "react";
import { useT } from "@i18n/LocaleContext";

const BackIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="rtl:-scale-x-100"
  >
    <path
      d="M9.57 5.92969L3.5 11.9997L9.57 18.0697"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20.4999 12H3.66992"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type PageHeaderProps = {
  category?: string;
  categoryClassName?: string;
  title: string;
  onBack?: () => void;
  right?: ReactNode;
};

const PageHeader = ({
  category,
  categoryClassName,
  title,
  onBack,
  right,
}: PageHeaderProps) => {
  const t = useT();
  return (
  <div className="relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 py-8 after:absolute after:-left-6 after:-right-6 after:bottom-0 after:h-px after:bg-border-strong">
    <div className="flex items-center gap-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={t("common.back")}
          className="shrink-0 text-content hover:opacity-70 transition-opacity"
        >
          <BackIcon />
        </button>
      )}
      <div className="flex flex-col gap-3">
        {category && (
          <span
            className={`inline-flex self-start items-center rounded-full px-[9px] text-[10px] font-extrabold uppercase leading-[22px] tracking-[2px] ${
              categoryClassName
                ? `text-charcoal ${categoryClassName}`
                : "bg-spacePurple text-white"
            }`}
          >
            {category}
          </span>
        )}
        <h1 className="text-[28px] sm:text-[40px] font-bold leading-tight sm:leading-none text-content">
          {title}
        </h1>
      </div>
    </div>
    {right}
  </div>
  );
};

export default PageHeader;
