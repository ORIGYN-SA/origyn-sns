import { Button } from "@components/ui";
import { useAddNeuron } from "./context";

const BtnAddNeuron = () => {
  const { handleShow } = useAddNeuron();
  return <Button onClick={handleShow}>Add neuron</Button>;
};

export default BtnAddNeuron;
