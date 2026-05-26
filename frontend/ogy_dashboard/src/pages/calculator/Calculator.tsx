import { Calculator as SharedCalculator } from "@origyn/shared/calculator";
import { MINTING_STUDIO_CANISTER_ID } from "@constants/index";

// The calculator now lives in the shared @origyn/shared workspace so the
// landing page can render the same component. The dashboard just supplies its
// env-configured Minting Studio canister id.
const Calculator = () => <SharedCalculator canisterId={MINTING_STUDIO_CANISTER_ID} />;

export default Calculator;
