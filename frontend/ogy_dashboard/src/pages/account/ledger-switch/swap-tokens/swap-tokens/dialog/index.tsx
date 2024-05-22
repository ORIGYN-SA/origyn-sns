import { Dialog } from "@components/ui";
import { useSwapTokens } from "../context";
import Form from "./form/Form";
import FormPending from "./form/FormPending";
import FormSuccess from "./form/FormSuccess";
import FormError from "./form/FormError";

const DialogClaimAllRewards = () => {
  const { show, handleClose, sendTokens, requestSwap } = useSwapTokens();

  const {
    isSuccess: isSuccessSendTokens,
    isError: isErrorSendTokens,
    isPending: isPendingSendTokens,
  } = sendTokens;
  const {
    isSuccess: isSuccessRequestSwap,
    isError: isErrorRequestSwap,
    isPending: isPendingRequestSwap,
  } = requestSwap;

  return (
    <>
      <Dialog show={show} handleClose={handleClose}>
        <div className="px-12 pt-8 pb-12">
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

export default DialogClaimAllRewards;
