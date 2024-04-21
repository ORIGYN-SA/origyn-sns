import { useState } from "react";
import { Link } from "react-router-dom";
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
      <Dialog show={show} handleOnClose={handleClose}>
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
            <Button>Go to NNS</Button>
          </Link>
        </div>
      </Dialog>
    </>
  );
};

export default StakeOGY;
