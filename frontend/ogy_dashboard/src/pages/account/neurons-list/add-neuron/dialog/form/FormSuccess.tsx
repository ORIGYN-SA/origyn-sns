import { Button } from "@components/ui";
import { useAddNeuron } from "../../context";

const FormSuccess = () => {
  const { handleClose } = useAddNeuron();

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-jade font-semibold">
        Neuron added successfully!
      </div>
      <Button onClick={handleClose}>Close</Button>
    </div>
  );
};

export default FormSuccess;
