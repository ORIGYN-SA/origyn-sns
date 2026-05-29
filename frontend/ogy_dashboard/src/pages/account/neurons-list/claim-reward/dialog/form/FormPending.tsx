import { LoaderSpin } from "@components/ui";
import { useT } from "@i18n/LocaleContext";

const FormPending = () => {
  const t = useT();
  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">{t("account.neurons.claim.pending")}</div>
      <LoaderSpin />
    </div>
  );
};

export default FormPending;
