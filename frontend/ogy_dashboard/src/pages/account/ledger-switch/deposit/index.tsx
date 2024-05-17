import useConnect from "@hooks/useConnect";
import useFetchBalanceOGYLegacy from "@services/queries/accounts/useFetchBalanceOGYLegacy";
import { Tooltip } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";

const Deposit = () => {
  const { accountId } = useConnect();

  const { data } = useFetchBalanceOGYLegacy();
  return (
    <div className="border border-border rounded-xl">
      <div className="grid grid-cols-2 gap-4 p-4">
        <div>Legacy OGY Balance</div>
        <div className="">
          <div className="text-xl">{data?.balanceOGY ?? 0} OGY</div>
          <div className="text-sm">{data?.balanceOGYUSD ?? 0} USD</div>
        </div>
      </div>
      <div className="flex items-center bg-surface-2 text-content/60 p-4">
        <div
          className="truncate"
          data-tooltip-id="tooltip_account_id"
          data-tooltip-content={accountId}
        >
          Account ID: {accountId}
        </div>
        <Tooltip id="tooltip_account_id" />
        <CopyToClipboard value={accountId as string} />
      </div>
    </div>
  );
};

export default Deposit;
