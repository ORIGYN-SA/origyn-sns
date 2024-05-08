import { Dialog } from "@components/ui";
import { useClaimAllRewards } from "../context";
import Form from "./form/Form";
import FormPending from "./form/FormPending";
import FormSuccess from "./form/FormSuccess";
import FormError from "./form/FormError";

const DialogClaimAllRewards = () => {
  const { show, handleClose, mutation } = useClaimAllRewards();

  const {
    isSuccess: isSuccessClaimAllRewards,
    isError: isErrorClaimAllRewards,
    isPending: isPendingClaimAllRewards,
  } = mutation;

  return (
    <>
      <Dialog show={show} handleClose={handleClose}>
        <div className="px-12 pt-8 pb-12">
          {!isPendingClaimAllRewards &&
            !isErrorClaimAllRewards &&
            !isSuccessClaimAllRewards && <Form />}
          {isPendingClaimAllRewards && <FormPending />}
          {isSuccessClaimAllRewards && <FormSuccess />}
          {isErrorClaimAllRewards && <FormError />}
        </div>
      </Dialog>
    </>
  );
};

export default DialogClaimAllRewards;
