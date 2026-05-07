import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Skeleton, Tile, Tooltip } from "@components/ui";

type PrincipalIdPillVariant = "short" | "long";

type PrincipalIdPillProps = {
  principalId: string | undefined;
  variant?: PrincipalIdPillVariant;
  showCopy?: boolean;
  className?: string;
};

const variantClasses: Record<PrincipalIdPillVariant, string> = {
  short: "h-[47px] w-[47px] sm:w-[225px] py-2 pl-1 pr-1 sm:pr-4",
  long: "h-[47px] w-full py-2 pl-1 pr-4",
};

const textClasses: Record<PrincipalIdPillVariant, string> = {
  short:
    "hidden min-w-0 flex-1 items-center font-sans text-[14px] leading-[48px] text-right sm:flex",
  long: "flex min-w-0 flex-1 items-center font-sans text-[14px] leading-[48px] text-right",
};

const PrincipalIcon = () => (
  <Tile className="rounded-full h-[39px] w-[39px] bg-surface-3">
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
  return (
    <div
      className={`flex items-center gap-2 rounded-[100px] border border-border-strong bg-surface-1 opacity-100 ${variantClasses[variant]} ${className}`}
    >
      <PrincipalIcon />
      <div className={textClasses[variant]}>
        <div className="mr-2 shrink-0 font-semibold">Principal ID:</div>
        {principalId ? (
          <>
            <Tooltip content={principalId}>
              <div className="min-w-0 flex-1 truncate font-normal">
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
