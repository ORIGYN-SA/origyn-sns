import { Button } from "@components/ui";
import useConnect from "@hooks/useConnect";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { useRemoveNeuron } from "../../context";

const Form = () => {
  const { principal } = useConnect();
  const { handleRemoveNeuronOwnership, mutation, handleClose } =
    useRemoveNeuron();

  const { reset: resetMutation } = mutation;

  const handleOnClose = () => {
    resetMutation();
    handleClose();
  };

  return (
    <div className="text-center mt-8">
      <div>Are you sure you want to remove this neuron?</div>
      <div className="mt-4 text-sm text-content/60">
        Make sure to also remove your principal{" "}
        <span className="font-semibold text-content">
          <span>{principal}</span>
          <span>
            <CopyToClipboard value={principal as string} />
          </span>
        </span>{" "}
        from the list of hotkeys of your neuron.
      </div>
      <div className="flex justify-center items-center mt-8 gap-4">
        <Button onClick={handleOnClose} className="bg-surface-3 text-content">
          No, cancel
        </Button>
        <Button onClick={handleRemoveNeuronOwnership}>Yes, delete</Button>
      </div>
    </div>
  );
};

export default Form;
