import { Button } from "@components/ui";
import { useSwapTokens } from "../context";

const Btn = () => {
  const { handleShow, fetchBalanceLegacy, accountId } = useSwapTokens();
  return (
    <Button
      className="w-full"
      onClick={handleShow}
      disabled={!fetchBalanceLegacy.isSuccess && !accountId}
    >
      Swap your tokens
    </Button>
  );
};

export default Btn;
