import { useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Tile, LoaderSpin } from "@components/ui";
import { StepperContext } from "../context";
import useRequestSwap from "@services/queries/switch-ledger/useRequestSwap";
import useFetchBalanceOGY from "@services/queries/accounts/useFetchBalanceOGY";

const Step2RequestSwap = () => {
  const queryClient = useQueryClient();
  const { nextStep, blockIndex, OGYLegacyBalance, setOGYBalance } =
    useContext(StepperContext);

  const {
    data: OGYBalance,
    isSuccess: isSuccessFetchOGYBalance,
    isLoading: isLoadingFetchOGYBalance,
    isFetching: isFetchingFetchOGYBalance,
    refetch: refetchFetchOGYBalance,
  } = useFetchBalanceOGY({ enabled: false });

  const {
    mutate: requestSwap,
    isError: isErrorRequestSwap,
    isPending: isPendingRequestSwap,
    isSuccess: isSuccessRequestSwap,
    // error: errorRequestSwap,
    // reset: resetRequestSwap,
  } = useRequestSwap();

  const handleRequestSwap = () => {
    requestSwap(
      { blockIndex: blockIndex as bigint },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["fetchBalanceOGYLegacy"],
          });
          refetchFetchOGYBalance();
        },
      }
    );
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isSuccessRequestSwap && isSuccessFetchOGYBalance) {
      setOGYBalance(OGYBalance);
      // Resolve delay by setting new OGY balance
      timeoutId = setTimeout(() => {
        nextStep();
      }, 500);
    }
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessFetchOGYBalance, isSuccessRequestSwap]);

  if (
    isPendingRequestSwap ||
    isLoadingFetchOGYBalance ||
    isFetchingFetchOGYBalance
  ) {
    return (
      <div className="p-8 flex flex-col justify-center items-center">
        <LoaderSpin />
        <div className="mt-8 font-semibold text-xl">
          Swap is being processed
        </div>
        <div className="text-content/60">This can take a few seconds</div>
      </div>
    );
  }

  if (isErrorRequestSwap) {
    return (
      <div className="flex flex-col items-center">
        <div className="font-semibold text-xl">Request swap error.</div>
        <div className="text-content/60">
          Your tokens were not swapped due to unexpected error.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col items-center">
        <div className="font-semibold text-xl">
          Tokens successfully deposited.
        </div>
        <div className="text-content/60">
          Your tokens were deposited to the swap canister in the block index{" "}
          {(blockIndex as bigint).toString()}
        </div>
        <div className="flex items-center rounded-full bg-surface-2 border border-border w-max pr-8 p-1 my-8">
          <Tile className="bg-surface-3 h-12 w-12 mr-4">X</Tile>
          <div className="flex items-center">
            <div className="text-content/60 mr-2">Block index:</div>
            <div className="font-semibold">
              {(blockIndex as bigint).toString()}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between">
          <div>Amount to swap</div>
          <div>{OGYLegacyBalance?.balanceOGY ?? 0}</div>
        </div>
        <div className="flex justify-between text-sm text-content/60">
          <div>Amount in dollars</div>
          <div>{OGYLegacyBalance?.balanceOGYUSD ?? 0} $</div>
        </div>
        <Button className="mt-12" onClick={handleRequestSwap}>
          Request swap
        </Button>
      </div>
    </div>
  );
};

export default Step2RequestSwap;
