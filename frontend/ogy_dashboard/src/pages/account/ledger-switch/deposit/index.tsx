import { useWallet } from "@amerej/artemis-react";
import useFetchBalanceOGYLegacyOwner from "@hooks/accounts/useFetchBalanceOGYLegacyOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";
import { Tooltip, Skeleton } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";

const Deposit = () => {
  const { accountId } = useWallet();

  const { data: balanceOGYLegacy } = useFetchBalanceOGYLegacyOwner();
  const { data: balanceOGYLegacyUSD } = useFetchBalanceOGYUSD({
    balance: balanceOGYLegacy?.balance,
  });

  return (
    <div className="border border-border rounded-xl">
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>Legacy OGY Balance</div>
        <div className="">
          <div className="text-xl">
            {balanceOGYLegacy?.balance !== undefined ? (
              `${balanceOGYLegacy.balance} OGY`
            ) : (
              <Skeleton className="w-32" />
            )}
          </div>
          <div className="text-sm">
            {balanceOGYLegacyUSD ? (
              `${balanceOGYLegacyUSD} USD`
            ) : (
              <Skeleton className="w-24" />
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center bg-surface-2 text-content/60 p-4">
        <div className="mr-2 shrink-0">Account ID: </div>
        {accountId ? (
          <>
            <div
              className="truncate"
              data-tooltip-id="tooltip_account_id"
              data-tooltip-content={accountId}
            >
              {accountId}
            </div>
            <Tooltip id="tooltip_account_id" />
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
