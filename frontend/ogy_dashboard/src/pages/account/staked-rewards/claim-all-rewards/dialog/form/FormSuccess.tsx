import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@components/ui";
import { useClaimAllRewards } from "../../context";
import { useT } from "@i18n/LocaleContext";

const FormSuccess = () => {
  const t = useT();
  const { handleClose } = useClaimAllRewards();

  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <CheckCircleIcon className="h-16 w-16 text-jade" />
        <div className="text-[22px] font-semibold leading-none text-content text-center">
          {t("account.rewards.successTitle")}
        </div>
      </div>
      <Button
        onClick={handleClose}
        className="w-full !py-0 text-[14px] leading-[44px]"
      >
        {t("common.close")}
      </Button>
    </>
  );
};

export default FormSuccess;
