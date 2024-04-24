import { useContext } from "react";
import { Button } from "@components/ui";
import { StepperContext } from "../context";

const Step2RequestSwap = () => {
  const { nextStep } = useContext(StepperContext);

  return (
    <div className="">
      <div className="font-bold text-lg">Tokens successfully deposited</div>
      <div className="text-sm mb-8 text-content/60">
        Your token were deposited to the swap canister
      </div>
      <Button onClick={nextStep}>Request swap</Button>
    </div>
  );
};

export default Step2RequestSwap;
