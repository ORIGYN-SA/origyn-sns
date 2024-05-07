import { Dialog as DialogHeadlessui } from "@headlessui/react";
import { Dialog } from "@components/ui";
import { useAddNeuron } from "../context";
import Form from "./form/Form";
import FormPending from "./form/FormPending";
import FormSuccess from "./form/FormSuccess";
import FormError from "./form/FormError";

const DialogAddNeuron = () => {
  const { show, handleClose, mutation } = useAddNeuron();

  const {
    isSuccess: isSuccessAddNeuron,
    isError: isErrorAddNeuron,
    isPending: isPendingAddNeuron,
  } = mutation;

  return (
    <>
      <Dialog show={show} handleClose={handleClose}>
        <DialogHeadlessui.Title>
          <div className="font-semibold p-6">Add neurons</div>
        </DialogHeadlessui.Title>
        <div className="px-12 pt-8 pb-12">
          {!isPendingAddNeuron && !isErrorAddNeuron && !isSuccessAddNeuron && (
            <Form />
          )}
          {isPendingAddNeuron && <FormPending />}
          {isSuccessAddNeuron && <FormSuccess />}
          {isErrorAddNeuron && <FormError />}
        </div>
      </Dialog>
    </>
  );
};

export default DialogAddNeuron;
