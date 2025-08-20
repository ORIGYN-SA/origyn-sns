import { Button } from "@components/ui";
import { useSwapTokens } from "../context";

const Btn = () => {
  const { handleShow, fetchBalanceLegacy, accountId } = useSwapTokens();
  const { data: balanceOGYLegacy } = fetchBalanceLegacy;

  const needsMoreForSwap =
    typeof balanceOGYLegacy?.balance === "undefined" ||
    balanceOGYLegacy?.balance < 1_000;

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
      {needsMoreForSwap && (
        <div className="text-sm text-red-500 text-center mt-2">
          You need to have at least 1'000 OGY to swap
        </div>
      )}
    </>
  );
};

export default Btn;
