import { useNavigate } from "react-router-dom";
import { Button } from "@components/ui";
import { useT, useLocalePath } from "@i18n/LocaleContext";
import { useSwapTokens } from "../../context";
import useFetchBalanceOGY from "@hooks/accounts/useFetchBalanceOGYOwner";
import useFetchBalanceOGYUSD from "@hooks/accounts/useFetchBalanceOGYUSD";
import { Skeleton } from "@components/ui";

const FormSuccess = () => {
  const t = useT();
  const lp = useLocalePath();
  const navigate = useNavigate();
  const { sendTokens, requestSwap, handleClose } = useSwapTokens();
  const { reset: resetSendTokens } = sendTokens;
  const { reset: resetRequestSwap } = requestSwap;
  const { data: balanceOGY } = useFetchBalanceOGY();
  const { data: balanceOGYUSD } = useFetchBalanceOGYUSD({
    balance: balanceOGY?.balance,
  });

  const handleOnCLick = () => {
    resetSendTokens();
    resetRequestSwap();
    handleClose();
    navigate(lp("/account"));
  };

  return (
    <div className="text-center">
      <div className="font-semibold text-xl text-jade mb-8">
        {t("account.ledgerSwitch.swap.success.title")}
      </div>
      <div className="border border-border rounded-xl">
        <div className="text-content/60 p-4 border-b border-border text-lg bg-surface-2 rounded-t-xl">
          {t("account.ledgerSwitch.swap.success.walletBalance")}
        </div>
        <div className="py-10 px-4 flex flex-col items-center">
          <div className="flex text-2xl font-semibold">
            {balanceOGY?.balance !== undefined ? (
              // Numeric/currency cluster (digits + OGY) stays LTR in every locale.
              <div dir="ltr">
                {balanceOGY.balance}
                <span className="text-content/60 ms-2">OGY</span>
              </div>
            ) : (
              <Skeleton className="w-32" />
            )}
          </div>
          <div className="flex">
            {balanceOGYUSD ? (
              <div dir="ltr" className="text-content/60">{balanceOGYUSD} USD</div>
            ) : (
              <Skeleton className="w-24" />
            )}
          </div>
        </div>
      </div>

      <Button className="mt-8 w-full" onClick={handleOnCLick}>
        {t("account.ledgerSwitch.swap.success.myAccount")}
      </Button>
    </div>
  );
};

export default FormSuccess;
