import { Button } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import { useSwapTokens } from "../context";

const Btn = () => {
  const t = useT();
  const {
    handleShow,
    fetchBalanceLegacy,
    accountId,
    isWhitelisted,
    swapDisabledReason,
  } = useSwapTokens();
  const { data: balanceOGYLegacy } = fetchBalanceLegacy;

  const needsMoreForSwap =
    typeof balanceOGYLegacy?.balance === "undefined" ||
    balanceOGYLegacy?.balance < 50_000;

  return (
    <>
      <Button
        className="h-12 w-full !px-[25px] !py-0 text-[14px] leading-[48px] transition-colors hover:bg-charcoal2 disabled:hover:bg-content"
        onClick={handleShow}
        title={swapDisabledReason}
        disabled={
          !!swapDisabledReason ||
          (((!fetchBalanceLegacy.isSuccess && !accountId) ||
            needsMoreForSwap) &&
            !isWhitelisted)
        }
      >
        {t("account.ledgerSwitch.swap.swapYourTokens")}
      </Button>

      <div className="mt-3 rounded-[16px] border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-center text-sm leading-5 text-yellow-700 dark:text-yellow-300">
        {swapDisabledReason ?? t("account.ledgerSwitch.swap.automaticDisabled")}
      </div>
    </>
  );
};

export default Btn;
