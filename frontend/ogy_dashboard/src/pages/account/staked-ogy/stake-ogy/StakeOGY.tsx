import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { NNS_PLATFORM_URL } from "@constants/index";
import useConnect from "@hooks/useConnect";
import { Button, Dialog } from "@components/ui";

const StakeOGY = () => {
  const { activeProvider } = useConnect();
  const [show, setShow] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <>
      <Button className="w-full" onClick={handleShow}>
        Stake
      </Button>
      <Dialog show={show} handleClose={handleClose}>
        <div className="pt-6 pb-12 px-4 text-center">
          <div className="font-bold text-lg">Stake OGY</div>
          <div className="text-sm mb-6">
            To stake OGY you need to go to our NNS platform.
          </div>
          {activeProvider &&
            activeProvider.meta.name !== "Internet Identity" && (
              <div className="w-full bg-yellow-400 p-4 rounded-xl text-center mb-6">
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
            className="mt-6"
          >
            <Button>
              <div className="flex items-center justify-center">
                <div>Go to NNS</div>
                <div>
                  <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5 text-background" />
                </div>
              </div>
            </Button>
          </Link>
        </div>
      </Dialog>
    </>
  );
};

export default StakeOGY;
