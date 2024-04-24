import { useState, useMemo } from "react";
import { Dialog as DialogHeadlessui } from "@headlessui/react";
import { useStepper } from "headless-stepper";
import { Button, Dialog } from "@components/ui";
import { StepperContext } from "./stepper/context";
import Step1SendTokens from "./stepper/step-1-send-tokens";
import Step2RequestSwap from "./stepper/step-2-request-swap";
import Step3Success from "./stepper/step-3-success";

// interface HeadlessStepperProps {}

const SwapTokens = () => {
  // const { principalShort } = useConnect();
  const [showDialog, setShowDialog] = useState(true);
  const steps = useMemo(
    () => [{ label: "1" }, { label: "2" }, { label: "3" }],
    []
  );
  const { state, nextStep, prevStep, setStep } = useStepper({
    steps,
  });

  const handleShowDialog = () => {
    setStep(0);
    setShowDialog(true);
  };
  const handleCloseDialog = () => setShowDialog(false);

  return (
    <>
      <Button className="w-full" onClick={handleShowDialog}>
        Swap your tokens
      </Button>
      <Dialog show={showDialog} handleClose={handleCloseDialog}>
        <DialogHeadlessui.Title>
          <div className="text-center font-semibold p-4">
            Step {steps[state.currentStep].label} of {state.totalSteps}
          </div>
        </DialogHeadlessui.Title>
        <div className="p-12 text-center">
          <StepperContext.Provider
            value={{
              prevStep,
              nextStep,
              handleCloseDialog,
              setStep,
            }}
          >
            {state.currentStep === 0 && <Step1SendTokens />}
            {state.currentStep === 1 && <Step2RequestSwap />}
            {state.currentStep === 2 && <Step3Success />}
          </StepperContext.Provider>
        </div>
      </Dialog>
    </>
  );
};

export default SwapTokens;
