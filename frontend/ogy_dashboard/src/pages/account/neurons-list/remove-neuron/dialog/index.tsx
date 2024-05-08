import { Dialog } from "@components/ui";
import { useRemoveNeuron } from "../context";
import Form from "./form/Form";
import FormPending from "./form/FormPending";
import FormSuccess from "./form/FormSuccess";
import FormError from "./form/FormError";

const DialogRemoveNeuron = () => {
  const { show, handleClose, mutation } = useRemoveNeuron();

  const {
    isSuccess: isSuccessRemoveNeuron,
    isError: isErrorRemoveNeuron,
    isPending: isPendingRemoveNeuron,
  } = mutation;

  return (
    <>
      <Dialog show={show} handleClose={handleClose}>
        <div className="px-12 pt-8 pb-12">
          {!isPendingRemoveNeuron &&
            !isErrorRemoveNeuron &&
            !isSuccessRemoveNeuron && <Form />}
          {isPendingRemoveNeuron && <FormPending />}
          {isSuccessRemoveNeuron && <FormSuccess />}
          {isErrorRemoveNeuron && <FormError />}
        </div>
      </Dialog>
    </>
  );
};

export default DialogRemoveNeuron;
