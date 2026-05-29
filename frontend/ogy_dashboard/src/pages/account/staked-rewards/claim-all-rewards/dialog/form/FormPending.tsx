import { LoaderSpin } from "@components/ui";
import { useT } from "@i18n/LocaleContext";

const FormPending = () => {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <LoaderSpin />
      <div className="text-[18px] font-semibold leading-none text-content">
        {t("account.rewards.pending")}
      </div>
    </div>
  );
};

export default FormPending;
