import { Link } from "react-router-dom";
import { useWallet } from "@components/auth/useWallet";
import { Button, Dialog } from "@components/ui";
import PrincipalIdPill from "@components/account/PrincipalIdPill";
import { NNS_PLATFORM_URL } from "@constants/index";
import { useAddNeuron } from "./context";

const DialogAddNeuron = () => {
  const { show, handleClose, handleAddNeuron } = useAddNeuron();
  const { principalId } = useWallet();

  return (
    <Dialog
      show={show}
      handleClose={handleClose}
      panelClassName="max-w-[420px] rounded-[20px] bg-white border border-[#E1E1E1] shadow-2xl"
      floatingClose
    >
      <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[420px] flex flex-col gap-7">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="text-[22px] font-semibold leading-none text-content">
            Add neuron
          </div>
          <div className="text-[13px] leading-snug text-muted max-w-[340px]">
            Add this principal as a hotkey on each OGY neuron you want to
            manage here.
          </div>
        </div>
        <PrincipalIdPill principalId={principalId} variant="long" showCopy />
        <Button
          onClick={handleAddNeuron}
          className="w-full !py-0 text-[14px] leading-[44px]"
        >
          Confirm
        </Button>
        <div className="text-center text-[12px] leading-none text-muted">
          Need to add a hotkey?{" "}
          <Link
            to={NNS_PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-content font-medium hover:underline"
          >
            Open the NNS app
          </Link>
        </div>
      </div>
    </Dialog>
  );
};

export default DialogAddNeuron;
