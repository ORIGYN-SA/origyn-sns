import { Button } from "@components/ui";
import { useSwapTokens } from "../context";

const Btn = () => {
  const { handleShow, fetchBalanceLegacy, accountId, isWhitelisted } =
    useSwapTokens();
  const { data: balanceOGYLegacy } = fetchBalanceLegacy;

  const needsMoreForSwap =
    typeof balanceOGYLegacy?.balance === "undefined" ||
    balanceOGYLegacy?.balance < 50_000;

  return (
    <>
      <Button
        className="h-12 w-full !px-[25px] !py-0 text-[14px] leading-[48px] transition-colors hover:bg-charcoal2 disabled:hover:bg-content"
        onClick={handleShow}
        disabled={
          ((!fetchBalanceLegacy.isSuccess && !accountId) || needsMoreForSwap) &&
          !isWhitelisted
        }
      >
        Swap your tokens
      </Button>

      <div className="mt-3 rounded-[16px] border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-center text-sm leading-5 text-yellow-700">
        Automatic swap has been disabled. You will need to get your swap request
        approved, min. amount is 50 000 OGY.
      </div>
    </>
  );
};

export default Btn;
