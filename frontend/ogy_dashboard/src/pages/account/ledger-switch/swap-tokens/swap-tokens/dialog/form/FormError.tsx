import { Button } from "@components/ui";
import { useSwapTokens } from "../../context";

const FormError = () => {
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
        Swap tokens error!
      </div>
      <div className="mt-4 p-4 mb-8 rounded-xl max-w-md overflow-auto bg-surface-2">
        {errorSendTokens?.message || errorRequestSwap?.message}
      </div>
      <div className="flex items-center">
        <Button className="mr-2" onClick={handleOnClose}>
          Close
        </Button>
        <Button onClick={handleRetry}>Retry</Button>
      </div>
    </div>
  );
};

export default FormError;
