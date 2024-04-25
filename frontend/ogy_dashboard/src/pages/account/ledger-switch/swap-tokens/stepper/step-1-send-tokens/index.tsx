import { useContext } from "react";
import { Button } from "@components/ui";
import useConnect from "@helpers/useConnect";
import { StepperContext } from "../context";
import { LoaderSpin } from "@components/ui";

const Step1SendTokens = () => {
  const { accountId } = useConnect();
  const { nextStep } = useContext(StepperContext);

  if (!accountId) {
    return (
      <div className="p-16">
        <LoaderSpin />
      </div>
    );
  }

  return (
    <div className="">
      <div className="font-bold text-lg">Swap your OGY to the new ledger</div>
      <div className="text-sm mb-8 text-content/60">
        Deposit any OGY tokens that you wish to swap to your account id
      </div>
      <div className="mb-8 rounded-lg bg-surface-2 border border-surface-3">
        <div className="truncate p-4 border-b border-surface-3">
          Account ID: {accountId}
        </div>
        <div>
          <div className="flex justify-between items-center font-bold px-4 pt-4">
            <div className="">Old ledger tokens</div>
            <div>0 OGY</div>
          </div>
          <div className="flex justify-between items-center text-content/60 px-4 pb-4">
            <div>New ledger tokens</div>
            <div>0 OGY</div>
          </div>
        </div>
      </div>
      <Button onClick={nextStep}>Send tokens to swap canister</Button>
    </div>
  );
};

export default Step1SendTokens;
