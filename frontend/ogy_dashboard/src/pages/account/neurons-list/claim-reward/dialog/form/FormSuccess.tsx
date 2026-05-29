import { Button } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import { useClaimReward } from "../../context";

const FormSuccess = () => {
  const t = useT();
  const { handleClose } = useClaimReward();

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-jade font-semibold">
        {t("account.neurons.claim.successTitle")}
      </div>
      <Button onClick={handleClose}>{t("common.close")}</Button>
    </div>
  );
};

export default FormSuccess;
