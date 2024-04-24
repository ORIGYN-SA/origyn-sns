import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/ui";
import { StepperContext } from "../context";

const Step3Success = () => {
  const { handleCloseDialog } = useContext(StepperContext);
  const navigate = useNavigate();

  const handleOnCLick = () => {
    handleCloseDialog();
    navigate("/account");
  };

  return (
    <div className="">
      <div className="font-bold text-lg">Swap was successful</div>
      <div className="text-sm mb-8 text-content/60">
        {/* Deposit any OGY tokens that you wish to swap to your account id */}
      </div>
      <Button onClick={handleOnCLick}>My account</Button>
    </div>
  );
};

export default Step3Success;
