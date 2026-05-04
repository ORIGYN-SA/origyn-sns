import { Button } from "@components/ui";
import { useAddNeuron } from "./context";

const BtnAddNeuron = () => {
  const { handleShow } = useAddNeuron();
  return (
    <Button
      onClick={handleShow}
      className="min-w-fit ml-auto md:ml-0 !px-[25px] !py-0 text-[14px] leading-[40px]"
    >
      Add neuron
    </Button>
  );
};

export default BtnAddNeuron;
