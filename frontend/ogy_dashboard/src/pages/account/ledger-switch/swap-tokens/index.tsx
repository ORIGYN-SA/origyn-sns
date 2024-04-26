import { useState, useMemo, useEffect } from "react";
import useFetchBalanceOGY from "@services/accounts/useFetchBalanceOGY";
import useFetchBalanceOGYLegacy, {
  IBalanceOGYLegacy,
} from "@services/accounts/useFetchBalanceOGYLegacy";
import { Dialog as DialogHeadlessui } from "@headlessui/react";
import { useStepper } from "headless-stepper";
import useConnect from "@helpers/useConnect";
import { Button, Dialog } from "@components/ui";
import { StepperContext } from "./stepper/context";
import Step1SendTokens from "./stepper/step-1-send-tokens";
import Step2RequestSwap from "./stepper/step-2-request-swap";
import Step3Success from "./stepper/step-3-success";

// interface HeadlessStepperProps {}

const SwapTokens = () => {
  const { accountId } = useConnect();
  const [showDialog, setShowDialog] = useState(false);
  const steps = useMemo(
    () => [{ label: "1" }, { label: "2" }, { label: "3" }],
    []
  );
  const setBlockIndex = (blockIndex: bigint) => {
    setState((prevState) => ({
      ...prevState,
      blockIndex: blockIndex,
    }));
  };
  const setOGYBalance = (OGYBalance: IBalanceOGYLegacy) => {
    setState((prevState) => ({
      ...prevState,
      OGYBalance: OGYBalance,
    }));
  };
  const {
    state: stateStepper,
    nextStep,
    prevStep,
    setStep,
  } = useStepper({
    steps,
  });

  const { data: balanceOGY, isSuccess: isSuccessFetchOGYBalance } =
    useFetchBalanceOGY({});
  const { data: balanceLegacyOGY, isSuccess: isSuccessFetchLegacyOGYBalance } =
    useFetchBalanceOGYLegacy();

  const handleShowDialog = () => {
    setStep(0);
    setShowDialog(true);
  };
  const handleCloseDialog = () => setShowDialog(false);

  const initState = {
    prevStep,
    nextStep,
    handleCloseDialog,
    setStep,
    blockIndex: 0n,
    setBlockIndex,
    OGYLegacyBalance: { balanceOGY: 0, balanceOGYUSD: "0" },
    OGYBalance: { balanceOGY: 0, balanceOGYUSD: "0" },
    accountId: "",
    setOGYBalance,
  };

  const [state, setState] = useState(initState);

  useEffect(() => {
    if (isSuccessFetchLegacyOGYBalance) {
      setState((prevState) => ({
        ...prevState,
        OGYLegacyBalance: balanceLegacyOGY,
      }));
    }
  }, [isSuccessFetchLegacyOGYBalance, balanceLegacyOGY]);

  useEffect(() => {
    if (isSuccessFetchOGYBalance) {
      setState((prevState) => ({
        ...prevState,
        OGYBalance: balanceOGY,
      }));
    }
  }, [isSuccessFetchOGYBalance, balanceOGY]);

  useEffect(() => {
    if (accountId) {
      setState((prevState) => ({
        ...prevState,
        accountId: accountId,
      }));
    }
  }, [accountId]);

  return (
    <>
      <Button
        className="w-full"
        onClick={handleShowDialog}
        disabled={
          !isSuccessFetchLegacyOGYBalance &&
          !isSuccessFetchOGYBalance &&
          !accountId
        }
      >
        Swap your tokens
      </Button>
      <Dialog show={showDialog} handleClose={handleCloseDialog}>
        <DialogHeadlessui.Title>
          <div className="text-center font-semibold p-4">
            Step {steps[stateStepper.currentStep].label} of{" "}
            {stateStepper.totalSteps}
          </div>
        </DialogHeadlessui.Title>
        <div className="px-12 pt-8 pb-12 text-center">
          <StepperContext.Provider value={state}>
            {stateStepper.currentStep === 0 && <Step1SendTokens />}
            {stateStepper.currentStep === 1 && <Step2RequestSwap />}
            {stateStepper.currentStep === 2 && <Step3Success />}
          </StepperContext.Provider>
        </div>
      </Dialog>
    </>
  );
};

export default SwapTokens;
