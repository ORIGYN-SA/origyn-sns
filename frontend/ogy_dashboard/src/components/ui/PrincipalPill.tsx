import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { FAKE_PRINCIPAL } from "@helpers/skeleton/fakeData";

const UserAvatarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type PrincipalPillProps = {
  label: string;
  value?: string | null;
  emptyLabel?: string;
  onNavigate?: (value: string) => void;
};

const PrincipalPill = ({
  label,
  value,
  emptyLabel,
  onNavigate,
}: PrincipalPillProps) => (
  <div className="flex items-center gap-3 rounded-full border border-border-strong bg-surface-1 py-1 ps-1 pe-4 min-w-0">
    <div className="flex items-center justify-center w-[39px] h-[39px] rounded-full bg-surface-3 text-white shrink-0">
      <UserAvatarIcon />
    </div>
    <span className="text-[14px] font-normal leading-tight text-muted shrink-0">
      {label}:
    </span>
    {emptyLabel ? (
      <span className="text-[14px] font-semibold leading-tight text-content truncate">
        {emptyLabel}
      </span>
    ) : value && onNavigate ? (
      <>
        <button
          type="button"
          onClick={() => onNavigate(value)}
          dir="ltr"
          className="text-[14px] font-semibold leading-tight text-content truncate min-w-0 hover:underline text-start cursor-pointer"
        >
          {value}
        </button>
        <span className="ms-auto shrink-0">
          <CopyToClipboard value={value} />
        </span>
      </>
    ) : (
      <span
        dir="ltr"
        className="text-[14px] font-semibold leading-tight text-content truncate min-w-0"
      >
        {value ?? FAKE_PRINCIPAL}
      </span>
    )}
  </div>
);

export default PrincipalPill;
