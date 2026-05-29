import {
  Calculator as SharedCalculator,
  type CalculatorMessages,
} from "@origyn/shared/calculator";
import { MINTING_STUDIO_CANISTER_ID } from "@constants/index";
import { useT } from "@i18n/LocaleContext";

// The calculator lives in the shared @origyn/shared workspace so the landing
// page can render the same component. The dashboard supplies its env-configured
// Minting Studio canister id and the translated strings for the active locale
// (the shared component merges these over its English defaults).
const Calculator = () => {
  const t = useT();
  return (
    <SharedCalculator
      canisterId={MINTING_STUDIO_CANISTER_ID}
      messages={t.raw<CalculatorMessages>("calculator")}
    />
  );
};

export default Calculator;
