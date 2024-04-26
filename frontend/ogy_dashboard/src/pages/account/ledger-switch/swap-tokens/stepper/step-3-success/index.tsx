import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/ui";
import { StepperContext } from "../context";

const Step3Success = () => {
  const { handleCloseDialog, OGYBalance } = useContext(StepperContext);
  const navigate = useNavigate();

  const handleOnCLick = () => {
    handleCloseDialog();
    navigate("/account");
  };

  return (
    <div>
      <div className="">
        <div className="font-semibold text-xl text-jade mb-8">
          Swap was successful!
        </div>
        <div className="border border-surface-3 rounded-xl">
          <div className="text-content/60 p-4 border-b border-surface-3 text-lg bg-surface-2 rounded-t-xl">
            Wallet balance on new ledger
          </div>
          <div className="py-10 px-4">
            <div className="text-2xl font-semibold">
              <span>{OGYBalance?.balanceOGY ?? 0} </span>
              <span className="text-content/60">OGY</span>
            </div>
            <div className="text-content/60">
              (${OGYBalance?.balanceOGYUSD ?? 0})
            </div>
          </div>
        </div>

        <Button className="mt-8 w-full" onClick={handleOnCLick}>
          My account
        </Button>
      </div>
    </div>
  );
};

export default Step3Success;
