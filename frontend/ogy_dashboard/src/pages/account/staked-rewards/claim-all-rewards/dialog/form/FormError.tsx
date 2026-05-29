import { XCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@components/ui";
import { useClaimAllRewards } from "../../context";
import { useT } from "@i18n/LocaleContext";

const FormError = () => {
  const t = useT();
  const { mutation, handleClose } = useClaimAllRewards();
  const { reset: resetMutation, error } = mutation;

  const handleClick = () => {
    resetMutation();
  };

  const handleOnClose = () => {
    resetMutation();
    handleClose();
  };

  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <XCircleIcon className="h-16 w-16 text-red-400" />
        <div className="text-[22px] font-semibold leading-none text-content text-center">
          {t("account.rewards.errorTitle")}
        </div>
      </div>
      <div className="rounded-2xl border border-border-strong bg-surface-faint px-4 py-3 text-[13px] leading-snug text-content max-h-40 overflow-auto break-words">
        {error?.message}
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleOnClose}
          className="flex-1 !py-0 text-[14px] leading-[44px]"
        >
          {t("common.close")}
        </Button>
        <Button
          onClick={handleClick}
          className="flex-1 !py-0 text-[14px] leading-[44px]"
        >
          {t("common.retry")}
        </Button>
      </div>
    </>
  );
};

export default FormError;
