import { Button } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import { useClaimReward } from "../../context";

const FormError = () => {
  const t = useT();
  const { mutation, handleClose } = useClaimReward();
  const { reset: resetMutation, error } = mutation;

  const handleClick = () => {
    resetMutation();
  };

  const handleOnClose = () => {
    resetMutation();
    handleClose();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-red-500 text-2xl font-semibold">
        {t("account.neurons.claim.errorTitle")}
      </div>
      <div className="mt-4 p-4 mb-8 rounded-xl max-w-md overflow-auto bg-surface-2">
        {error?.message}
      </div>
      <div className="flex items-center">
        <Button className="me-2" onClick={handleOnClose}>
          {t("common.close")}
        </Button>
        <Button onClick={handleClick}>{t("account.neurons.claim.retry")}</Button>
      </div>
    </div>
  );
};

export default FormError;
