import { Link } from "react-router-dom";
import { useWallet } from "@amerej/artemis-react";
import { Button, Dialog } from "@components/ui";
import CopyToClipboard from "@components/buttons/CopyToClipboard";
import { NNS_PLATFORM_URL } from "@constants/index";
import { useAddNeuron } from "./context";

const DialogAddNeuron = () => {
  const { show, handleClose, handleAddNeuron } = useAddNeuron();
  const { principalId } = useWallet();

  return (
    <>
      <Dialog show={show} handleClose={handleClose}>
        <div className="px-12 pb-12">
          <div className="text-center">
            <div className="mb-4 text-xl font-semibold">Add neuron</div>
            To successfully connect each neuron to the dashboard, you need to
            add your principal
            <span className="font-semibold ml-1">
              <span>{principalId}</span>
              <span>
                <CopyToClipboard value={principalId as string} />
              </span>
            </span>
            as a hotkey to your OGY neuron which you wish to include in this
            dashboard. To do this, open the{" "}
            <span>
              <Link
                to={NNS_PLATFORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent font-semibold"
              >
                NNS app
              </Link>
            </span>
            , click into each neuron and add your principal as a hotkey.
          </div>

          <div className="flex justify-center items-center mt-8 gap-4">
            <Button onClick={handleAddNeuron}>Confirm</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default DialogAddNeuron;
