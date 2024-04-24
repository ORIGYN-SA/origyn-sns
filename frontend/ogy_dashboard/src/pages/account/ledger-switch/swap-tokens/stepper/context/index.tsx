import { createContext } from "react";

export interface IStepper {
  prevStep: () => void;
  nextStep: () => void;
  handleCloseDialog: () => void;
  setStep: (step: number) => void;
}

export const StepperContext = createContext<IStepper>({
  prevStep: () => {},
  nextStep: () => {},
  handleCloseDialog: () => {},
  setStep: () => {},
});
