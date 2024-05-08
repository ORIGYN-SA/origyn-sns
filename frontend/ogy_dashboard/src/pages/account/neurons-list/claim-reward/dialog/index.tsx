import { Dialog } from "@components/ui";
import { useClaimReward } from "../context";
import Form from "./form/Form";
import FormPending from "./form/FormPending";
import FormSuccess from "./form/FormSuccess";
import FormError from "./form/FormError";

const DialogClaimReward = () => {
  const { show, handleClose, mutation } = useClaimReward();

  const {
    isSuccess: isSuccessClaimReward,
    isError: isErrorClaimReward,
    isPending: isPendingClaimReward,
  } = mutation;

  return (
    <>
      <Dialog show={show} handleClose={handleClose}>
        <div className="px-12 pt-8 pb-12">
          {!isPendingClaimReward &&
            !isErrorClaimReward &&
            !isSuccessClaimReward && <Form />}
          {isPendingClaimReward && <FormPending />}
          {isSuccessClaimReward && <FormSuccess />}
          {isErrorClaimReward && <FormError />}
        </div>
      </Dialog>
    </>
  );
};

export default DialogClaimReward;
