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
    <div className="flex flex-col items-center">
      <div className="text-red-500 text-2xl font-semibold">
        Claim all rewards error!
      </div>
      <div className="mt-4 p-4 mb-8 rounded-xl max-w-md overflow-auto bg-surface-2">
        {error?.message}
      </div>
      <div className="flex items-center">
        <Button className="mr-2" onClick={handleOnClose}>
          Close
        </Button>
        <Button onClick={handleClick}>Retry</Button>
      </div>
    </div>
  );
};

export default FormError;
