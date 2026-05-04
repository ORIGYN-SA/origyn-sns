import { XCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@components/ui";
import { useClaimAllRewards } from "../../context";

const FormError = () => {
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
          Claim all rewards error!
        </div>
      </div>
      <div className="rounded-2xl border border-[#E1E1E1] bg-surface-faint px-4 py-3 text-[13px] leading-snug text-content max-h-40 overflow-auto break-words">
        {error?.message}
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleOnClose}
          className="flex-1 !py-0 text-[14px] leading-[44px]"
        >
          Close
        </Button>
        <Button
          onClick={handleClick}
          className="flex-1 !py-0 text-[14px] leading-[44px]"
        >
          Retry
        </Button>
      </div>
    </>
  );
};

export default FormError;
