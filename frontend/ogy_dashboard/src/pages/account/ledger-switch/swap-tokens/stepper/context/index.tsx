import { createContext } from "react";
import { IBalanceOGYLegacy } from "@services/queries/accounts/useFetchBalanceOGYLegacy";

export interface IStepper {
  prevStep: () => void;
  nextStep: () => void;
  handleCloseDialog: () => void;
  setStep: (step: number) => void;
  blockIndex?: bigint;
  setBlockIndex: (blockIndex: bigint) => void;
  OGYLegacyBalance: IBalanceOGYLegacy;
  OGYBalance: IBalanceOGYLegacy; // TODO: create generic type instead of Legacy
  setOGYBalance: (OGYBalance: IBalanceOGYLegacy) => void;
  accountId: string;
}

export const StepperContext = createContext<IStepper>({
  prevStep: () => {},
  nextStep: () => {},
  handleCloseDialog: () => {},
  setStep: () => {},
  blockIndex: 0n,
  setBlockIndex: () => {},
  OGYLegacyBalance: { balanceOGY: 0, balanceOGYUSD: "0" },
  OGYBalance: { balanceOGY: 0, balanceOGYUSD: "0" },
  setOGYBalance: () => {},
  accountId: "",
});
