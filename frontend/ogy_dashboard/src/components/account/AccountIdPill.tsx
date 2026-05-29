import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { Skeleton, Tooltip } from "@components/ui";
import { useT } from "@i18n/LocaleContext";

const AccountIdPill = ({
  accountId,
  className = "",
}: {
  accountId: string | undefined;
  className?: string;
}) => {
  const t = useT();
  return (
    <div
      className={`flex h-[47px] w-full items-center gap-2 rounded-[100px] border border-border-strong bg-surface-1 px-4 text-end font-sans text-[14px] leading-[48px] text-content ${className}`}
    >
      <div className="shrink-0 font-semibold">{t("account.principal.accountIdLabel")}</div>
      {accountId ? (
        <>
          {/* Account ID is an inherently-LTR identifier; keep it (and the copy
              control) LTR so RTL bidi doesn't reorder the truncated string. */}
          <Tooltip content={accountId}>
            <div dir="ltr" className="min-w-0 flex-1 truncate font-normal text-start">
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
