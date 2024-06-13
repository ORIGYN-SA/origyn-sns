import { Dialog } from "@components/ui";
import { useSwapTokens } from "../context";
import Form from "./form/Form";
import FormPending from "./form/FormPending";
import FormSuccess from "./form/FormSuccess";
import FormError from "./form/FormError";

const DialogSwapTokens = () => {
  const { show, handleClose, sendTokens, requestSwap } = useSwapTokens();

  const {
    isSuccess: isSuccessSendTokens,
    isError: isErrorSendTokens,
    isPending: isPendingSendTokens,
    isIdle: isIdleSendTokens,
  } = sendTokens;
  const {
    isSuccess: isSuccessRequestSwap,
    isError: isErrorRequestSwap,
    isPending: isPendingRequestSwap,
  } = requestSwap;

  const handleOnClose = () => {
    if (
      isSuccessRequestSwap ||
      isErrorSendTokens ||
      isErrorRequestSwap ||
      isIdleSendTokens
    ) {
      handleClose();
    }
    return null;
  };

  return (
    <>
      <Dialog show={show} handleClose={handleOnClose}>
        <div className="px-12 pt-6 pb-12">
          {!isPendingSendTokens &&
            !isPendingRequestSwap &&
            !isErrorSendTokens &&
            !isErrorRequestSwap &&
            !isSuccessSendTokens &&
            !isSuccessRequestSwap && <Form />}
          {(isPendingSendTokens || isPendingRequestSwap) && <FormPending />}
          {isSuccessSendTokens && isSuccessRequestSwap && <FormSuccess />}
          {(isErrorSendTokens || isErrorRequestSwap) && <FormError />}
        </div>
      </Dialog>
    </>
  );
};

export default DialogSwapTokens;
