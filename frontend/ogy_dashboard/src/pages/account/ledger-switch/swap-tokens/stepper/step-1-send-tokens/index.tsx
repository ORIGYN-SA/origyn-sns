import { useContext } from "react";
import { Button } from "@components/ui";
import { StepperContext } from "../context";
import { LoaderSpin } from "@components/ui";
import useSendTokens from "@services/switch-ledger/useSendTokens";

const Step1SendTokens = () => {
  const {
    nextStep,
    handleCloseDialog,
    setBlockIndex,
    OGYLegacyBalance,
    OGYBalance,
    accountId,
  } = useContext(StepperContext);

  const {
    mutate: requestDepositAccount,
    isError: isErrorSendTokens,
    isPending: isPendingSendTokens,
    // error: errorSendTokens,
    reset: resetSendTokens,
  } = useSendTokens();

  const handleOnClick = () => {
    requestDepositAccount(undefined, {
      onSuccess: (data) => {
        setBlockIndex(data as bigint);
        nextStep();
      },
      onError: (err) => {
        console.log(err);
      },
    });
  };

  const handleOnClickRetry = () => {
    resetSendTokens();
  };

  if (isPendingSendTokens) {
    return (
      <div className="p-8 flex flex-col justify-center items-center">
        <LoaderSpin />
        <div className="mt-8 font-semibold text-xl">
          Depositing tokens to the swap canister.
        </div>
      </div>
    );
  }

  if (isErrorSendTokens) {
    return (
      <div className="flex flex-col items-center">
        <div className="font-semibold text-xl">Tokens deposit error.</div>
        <div className="text-content/60">
          Your tokens were not deposited due to unexpected error.
        </div>
        <div className="mt-12">
          <Button
            className="mr-4 bg-surface-2 text-black"
            onClick={handleCloseDialog}
          >
            Cancel
          </Button>
          <Button onClick={handleOnClickRetry}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="font-bold text-lg">Swap your OGY to the new ledger</div>
      <div className="text-sm mb-8 text-content/60">
        Deposit any OGY tokens that you wish to swap to your account id
      </div>
      <div className="mb-8 rounded-xl bg-surface-2 border border-border">
        <div className="truncate p-4 border-b border-border">
          Account ID: {accountId}
        </div>
        <div>
          <div className="flex justify-between items-center font-bold px-4 pt-4">
            <div className="">Old ledger tokens</div>
            <div>{OGYLegacyBalance?.balanceOGY ?? 0} OGY</div>
          </div>
          <div className="flex justify-between items-center text-content/60 px-4 pb-4">
            <div>New ledger tokens</div>
            <div>{OGYBalance?.balanceOGY ?? 0} OGY</div>
          </div>
        </div>
      </div>
      <Button onClick={handleOnClick}>Send tokens to swap canister</Button>
    </div>
  );
};

export default Step1SendTokens;
