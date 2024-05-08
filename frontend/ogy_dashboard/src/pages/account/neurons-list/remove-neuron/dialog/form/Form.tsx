import { Button } from "@components/ui";
import { useRemoveNeuron } from "../../context";

const Form = () => {
  const { handleRemoveNeuronOwnership } = useRemoveNeuron();

  return (
    <div className="text-center mt-8">
      <div>You're about to remove neuron ownership</div>
      <div className="mt-4 text-sm text-content/60">TODO: add text</div>
      <Button onClick={handleRemoveNeuronOwnership} className="mt-8 w-full">
        Confirm
      </Button>
    </div>
  );
};

export default Form;
