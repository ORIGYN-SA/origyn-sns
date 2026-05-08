import { Dialog, Button } from "@components/ui";
import { useRemoveNeuron } from "./context";
import { useWallet } from "@components/auth/useWallet";
import PrincipalIdPill from "@components/account/PrincipalIdPill";

const DialogRemoveNeuron = () => {
  const { principalId } = useWallet();
  const { show, handleClose, handleRemoveNeuron } = useRemoveNeuron();

  return (
    <Dialog show={show} handleClose={handleClose}>
      <div className="px-12 pb-12">
        <div className="text-center mt-2">
          <div className="text-lg font-semibold">Remove neuron</div>
          <div className="mt-4 text-content/60">
            In order to remove this neuron, you need to remove your principal
            from the list of hotkeys of your neuron.
          </div>
          <div className="mt-6">
            <PrincipalIdPill
              principalId={principalId}
              variant="long"
              showCopy
            />
          </div>
          <div className="flex justify-center items-center mt-8 gap-4">
            <Button onClick={handleRemoveNeuron}>Confirm</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default DialogRemoveNeuron;
