import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Skeleton, Tooltip } from "@components/ui";

const AccountIdPill = ({
  accountId,
  className = "",
}: {
  accountId: string | undefined;
  className?: string;
}) => {
  return (
    <div
      className={`flex h-[47px] w-full items-center gap-2 rounded-[100px] border border-border-strong bg-surface-1 px-4 text-right font-sans text-[14px] leading-[48px] text-content ${className}`}
    >
      <div className="shrink-0 font-semibold">Account ID:</div>
      {accountId ? (
        <>
          <Tooltip content={accountId}>
            <div className="min-w-0 flex-1 truncate font-normal">
              {accountId}
            </div>
          </Tooltip>
          <CopyToClipboard value={accountId} />
        </>
      ) : (
        <Skeleton className="w-64" />
      )}
    </div>
  );
};

export default AccountIdPill;
