import { Button } from "@components/ui";
import { useRemoveNeuron } from "../../context";

const FormSuccess = () => {
  const { handleClose } = useRemoveNeuron();

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-jade font-semibold">
        Neuron ownership removed successfully!
      </div>
      <Button onClick={handleClose}>Close</Button>
    </div>
  );
};

export default FormSuccess;
