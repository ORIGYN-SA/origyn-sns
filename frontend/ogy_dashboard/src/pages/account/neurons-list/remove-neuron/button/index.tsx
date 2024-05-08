import { TrashIcon } from "@heroicons/react/24/outline";
import { Tile } from "@components/ui";
import { useRemoveNeuron } from "../context";

const BtnRemoveNeuron = () => {
  const { handleShow } = useRemoveNeuron();
  return (
    <Tile>
      <button onClick={handleShow}>
        <TrashIcon className="h-5 w-5" />
      </button>
    </Tile>
  );
};

export default BtnRemoveNeuron;
