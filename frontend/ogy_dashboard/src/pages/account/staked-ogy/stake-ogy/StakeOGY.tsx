import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@components/auth/useWallet";

import { NNS_PLATFORM_URL } from "@constants/index";
import { Button, Dialog } from "@components/ui";

const StakeOGY = () => {
  const { walletSelected } = useWallet();
  const [show, setShow] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <>
      <Button
        className="h-12 w-full !px-[25px] !py-0 text-[14px] leading-[48px] transition-colors hover:bg-charcoal2"
        onClick={handleShow}
      >
        Stake
      </Button>
      <Dialog
        show={show}
        handleClose={handleClose}
        panelClassName="max-w-[420px] rounded-[20px] bg-surface-1 border border-border-strong shadow-2xl"
        floatingClose
      >
        <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[420px] flex flex-col gap-7">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="text-[22px] font-semibold leading-none text-content">
              Stake OGY
            </div>
            <div className="text-[13px] leading-snug text-muted max-w-[340px]">
              To stake OGY you need to go to our NNS platform.
            </div>
          </div>
          {walletSelected && walletSelected !== "dfinity" && (
            <div className="rounded-2xl border border-[#F4E5A1] bg-[#FFF8E1] p-4 text-center text-[13px] leading-snug text-content">
              It appears you are not connected with{" "}
              <span className="font-semibold">Internet Identity</span>.
              <br /> You need an{" "}
              <span className="font-semibold">Internet Identity</span> to
              connect to NNS platform.
            </div>
          )}
          <Link
            to={NNS_PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
          >
            <Button className="w-full !py-0 text-[14px] leading-[44px] flex items-center justify-center gap-2">
              <span>Go to NNS</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Dialog>
    </>
  );
};

export default StakeOGY;
