import { useWallet } from "@components/auth/useWallet";
import useFetchBalanceOGYLegacyOwner from "@hooks/accounts/useFetchBalanceOGYLegacyOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";
import { Stat } from "@components/dashboard";
import { roundAndFormatLocale } from "@helpers/numbers";
import { Tooltip, Skeleton } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";

const Deposit = () => {
  const { accountId } = useWallet();

  const { data: balanceOGYLegacy } = useFetchBalanceOGYLegacyOwner();
  const { data: balanceOGYLegacyUSD } = useFetchBalanceOGYUSD({
    balance: balanceOGYLegacy?.balance,
  });

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-surface-1">
      <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
        <div className="text-sm font-medium text-muted">Legacy OGY Balance</div>
        <div className="min-w-0 text-right">
          <Stat
            iconSrc="/ogy_logo.svg"
            value={
              balanceOGYLegacy?.balance !== undefined
                ? roundAndFormatLocale({ number: balanceOGYLegacy.balance })
                : undefined
            }
            unit="OGY"
            loading={balanceOGYLegacy?.balance === undefined}
            className="justify-end"
          />
          <div className="mt-1 text-sm text-muted">
            {balanceOGYLegacyUSD ? (
              `${balanceOGYLegacyUSD} USD`
            ) : (
              <Skeleton className="w-24" />
            )}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 items-center border-t border-border bg-surface-muted p-4 text-sm text-muted">
        <div className="mr-2 shrink-0 font-medium">Account ID: </div>
        {accountId ? (
          <>
            <Tooltip content={accountId}>
              <div className="min-w-0 flex-1 truncate pr-3 font-mono text-xs">
                {accountId}
              </div>
            </Tooltip>
            <CopyToClipboard value={accountId as string} />
          </>
        ) : (
          <Skeleton className="w-32" />
        )}
      </div>
    </div>
  );
};

export default Deposit;
