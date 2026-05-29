import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Skeleton, Tile, Tooltip } from "@components/ui";
import { useT } from "@i18n/LocaleContext";

type PrincipalIdPillVariant = "short" | "long";

type PrincipalIdPillProps = {
  principalId: string | undefined;
  variant?: PrincipalIdPillVariant;
  showCopy?: boolean;
  className?: string;
};

const variantClasses: Record<PrincipalIdPillVariant, string> = {
  short:
    "h-[47px] w-[47px] justify-center sm:w-[225px] sm:justify-start sm:py-2 sm:ps-1 sm:pe-4",
  long: "h-[47px] w-full py-2 ps-1 pe-4",
};

const textClasses: Record<PrincipalIdPillVariant, string> = {
  short:
    "hidden min-w-0 flex-1 items-center font-sans text-[14px] leading-[48px] text-end sm:flex",
  long: "flex min-w-0 flex-1 items-center font-sans text-[14px] leading-[48px] text-end",
};

const PrincipalIcon = () => (
  <Tile className="h-[39px] w-[39px] rounded-full bg-surface-3">
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.76926 7.9574C9.33548 7.9574 10.6052 6.68773 10.6052 5.12152C10.6052 3.55531 9.33548 2.28564 7.76926 2.28564C6.20303 2.28564 4.93335 3.55531 4.93335 5.12152C4.93335 6.68773 6.20303 7.9574 7.76926 7.9574Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2532 14.857C13.0339 12.5852 11.2321 10.7991 8.96021 10.5954C8.17681 10.517 7.37774 10.517 6.57867 10.5954C4.30682 10.8147 2.505 12.5852 2.28564 14.857"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </Tile>
);

const PrincipalIdPill = ({
  principalId,
  variant = "long",
  showCopy = false,
  className = "",
}: PrincipalIdPillProps) => {
  const t = useT();
  return (
    <div
      className={`flex items-center gap-2 rounded-[100px] border border-border-strong bg-surface-1 opacity-100 ${variantClasses[variant]} ${className}`}
    >
      <PrincipalIcon />
      <div className={textClasses[variant]}>
        <div className="me-2 shrink-0 font-semibold">{t("account.principal.principalIdLabel")}</div>
        {principalId ? (
          <>
            {/* Principal ID is an inherently-LTR identifier; keep it LTR so RTL
                bidi doesn't reorder the truncated string. */}
            <Tooltip content={principalId}>
              <div dir="ltr" className="min-w-0 flex-1 truncate font-normal text-start">
                {principalId}
              </div>
            </Tooltip>
            {showCopy && <CopyToClipboard value={principalId} />}
          </>
        ) : (
          <Skeleton className={variant === "short" ? "w-24" : "w-64"} />
        )}
      </div>
    </div>
  );
};

export default PrincipalIdPill;
