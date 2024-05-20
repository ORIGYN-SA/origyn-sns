import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@components/ui";
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
      <div className="text-sm text-content/60 mb-8">
        Deposit any OGY tokens that you wish to swap to your account id
      </div>
      <div className="mb-8 rounded-xl bg-surface-2 border border-border">
        <div className="truncate p-4 border-b border-border">
          Account ID: {accountId}
        </div>

        <div className="flex justify-between items-center font-bold px-4 py-4">
          <div className="">Tokens available to swap</div>
          <div>{balanceOGYLegacy?.balance} OGY</div>
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
