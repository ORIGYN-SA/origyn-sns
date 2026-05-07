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
    <Dialog
      show={show}
      handleClose={handleClose}
      panelClassName="max-w-[420px] rounded-[20px] bg-surface-1 border border-border-strong shadow-2xl"
      floatingClose
    >
      <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[420px] flex flex-col gap-7">
        {!isPendingClaimAllRewards &&
          !isErrorClaimAllRewards &&
          !isSuccessClaimAllRewards && <Form />}
        {isPendingClaimAllRewards && <FormPending />}
        {isSuccessClaimAllRewards && <FormSuccess />}
        {isErrorClaimAllRewards && <FormError />}
      </div>
    </Dialog>
  );
};

export default DialogClaimAllRewards;
