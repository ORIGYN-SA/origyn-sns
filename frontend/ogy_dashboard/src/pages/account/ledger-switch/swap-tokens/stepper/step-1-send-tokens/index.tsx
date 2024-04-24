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
      <div>{accountId}</div>
      <Button onClick={nextStep}>Send tokens to swap canister</Button>
    </div>
  );
};

export default Step1SendTokens;
