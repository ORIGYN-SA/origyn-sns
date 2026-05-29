import { Button } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import { useSwapTokens } from "../../context";

const FormError = () => {
  const t = useT();
  const { sendTokens, requestSwap, handleClose } = useSwapTokens();
  const { reset: resetSendTokens, error: errorSendTokens } = sendTokens;
  const { reset: resetRequestSwap, error: errorRequestSwap } = requestSwap;

  const handleRetry = () => {
    resetSendTokens();
    resetRequestSwap();
  };

  const handleOnClose = () => {
    resetSendTokens();
    resetRequestSwap();
    handleClose();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-red-500 text-2xl font-semibold">
        {t("account.ledgerSwitch.swap.error.title")}
      </div>
      <div className="mt-4 p-4 mb-8 rounded-xl max-w-md overflow-auto bg-surface-2">
        {errorSendTokens?.message || errorRequestSwap?.message}
      </div>
      <div className="flex items-center">
        <Button className="me-2" onClick={handleOnClose}>
          {t("common.close")}
        </Button>
        <Button onClick={handleRetry}>
          {t("account.ledgerSwitch.swap.error.retry")}
        </Button>
      </div>
    </div>
  );
};

export default FormError;
