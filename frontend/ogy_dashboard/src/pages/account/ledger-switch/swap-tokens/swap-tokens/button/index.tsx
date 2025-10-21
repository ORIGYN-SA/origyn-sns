import { Button } from "@components/ui";
import { useSwapTokens } from "../context";

const Btn = () => {
  const { handleShow, fetchBalanceLegacy, accountId } = useSwapTokens();
  const { data: balanceOGYLegacy } = fetchBalanceLegacy;

  const needsMoreForSwap =
    typeof balanceOGYLegacy?.balance === "undefined" ||
    balanceOGYLegacy?.balance < 50_000;

  return (
    <>
      <Button
        className="w-full"
        onClick={handleShow}
        disabled={
          (!fetchBalanceLegacy.isSuccess && !accountId) || needsMoreForSwap
        }
      >
        Swap your tokens
      </Button>

      <div className="text-sm text-yellow-500 text-center mt-2">
        Automatic swap has been disabled. You will need to get your swap request
        approved, min. amount is 88 000 OGY.
      </div>
    </>
  );
};

export default Btn;
