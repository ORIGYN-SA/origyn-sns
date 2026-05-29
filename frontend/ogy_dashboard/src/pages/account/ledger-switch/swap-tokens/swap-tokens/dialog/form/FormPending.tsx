import { LoaderSpin } from "@components/ui";
import { useT } from "@i18n/LocaleContext";

const FormPending = () => {
  const t = useT();
  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-orange-400 p-4 rounded-xl text-center">
        {t("account.ledgerSwitch.swap.pending.takesTime")}
        <br />
        <span className="text-lg font-bold">
          {t("account.ledgerSwitch.swap.pending.doNotRefresh")}
        </span>
      </div>
      <div className="my-8 font-semibold">
        {t("account.ledgerSwitch.swap.pending.swapping")}
      </div>
      <LoaderSpin />
    </div>
  );
};

export default FormPending;
