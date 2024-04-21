import { useState } from "react";
import useConnect from "@helpers/useConnect";
import { Button, Dialog } from "@components/ui";

const WithdrawLegacyTokens = () => {
  const { principalShort } = useConnect();
  const [show, setShow] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  return (
    <>
      <Button className="w-full" onClick={handleShow}>
        Withdraw your tokens
      </Button>
      <Dialog show={show} handleOnClose={handleClose}>
        <div className="p-12 text-center">
          <div className="">
            <span>You are about to withdraw </span>
            <span className="font-bold text-lg">?? OGY.</span>
          </div>
          <div className="text-sm mb-8">
            <span className="text-content/60">
              The tokens will be sent to your principal
            </span>
            <span> {principalShort}</span>
          </div>
          <Button onClick={handleClose}>Confirm</Button>
        </div>
      </Dialog>
    </>
  );
};

export default WithdrawLegacyTokens;
