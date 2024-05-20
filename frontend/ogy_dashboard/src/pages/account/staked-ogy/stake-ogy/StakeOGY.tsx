import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { NNS_PLATFORM_URL } from "@constants/index";
import { Button, Dialog } from "@components/ui";

const StakeOGY = () => {
  const [show, setShow] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <>
      <Button className="w-full" onClick={handleShow}>
        Stake
      </Button>
      <Dialog show={show} handleClose={handleClose}>
        <div className="p-12 text-center">
          <div>Stake OGY</div>
          <div className="text-sm mb-8">
            To stake OGY you need to go to our NNS platform.
          </div>
          <Link
            to={NNS_PLATFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
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
