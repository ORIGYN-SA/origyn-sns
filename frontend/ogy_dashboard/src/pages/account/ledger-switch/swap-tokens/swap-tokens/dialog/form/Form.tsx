import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, Skeleton, Button } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { useSwapTokens } from "../../context";

const Form = () => {
  const queryClient = useQueryClient();
  const { accountId, sendTokens, requestSwap, fetchBalanceLegacy } =
    useSwapTokens();
  const { mutate: mutateSendTokens } = sendTokens;
  const { mutate: mutateRequestSwap } = requestSwap;
  const { data: balanceOGYLegacy } = fetchBalanceLegacy;

  const handleOnClick = () => {
    mutateSendTokens(undefined, {
      onSuccess: (data) => {
        mutateRequestSwap(
          { blockIndex: data as bigint },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["userFetchBalanceOGYLegacy"],
              });
              queryClient.invalidateQueries({
                queryKey: ["userFetchBalanceOGY"],
              });
            },
          }
        );
      },
    });
  };

  return (
    <div className="text-center">
      <div className="font-bold text-lg">Swap your OGY to the new ledger</div>
      <div className="text-sm text-content/60 mb-12">
        Deposit any OGY tokens that you wish to swap to your account id
      </div>
      <div className="mb-8 rounded-xl bg-surface-2 border border-border">
        <div className="truncate p-4 border-b border-border">
          <div className="flex items-center">
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

        <div className="px-4 py-4">
          <div className="flex justify-between items-center font-bold">
            <div className="">Tokens available to swap</div>
            <div>{balanceOGYLegacy?.balance} OGY</div>
          </div>
        </div>
      </div>
      <div className="text-content/60 my-8">
        You will receive {balanceOGYLegacy?.balance} OGY tokens on the new
        ledger.
      </div>
      <Button onClick={handleOnClick}>
        Swap {balanceOGYLegacy?.balance} OGY tokens
      </Button>
    </div>
  );
};

export default Form;
