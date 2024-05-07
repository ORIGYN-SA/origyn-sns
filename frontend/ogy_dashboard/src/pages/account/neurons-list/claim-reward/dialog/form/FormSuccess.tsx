import { Button } from "@components/ui";
import { useClaimReward } from "../../context";

const FormSuccess = () => {
  const { handleClose } = useClaimReward();

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-jade font-semibold">
        Claim reward successfull!
      </div>
      <Button onClick={handleClose}>Close</Button>
    </div>
  );
};

export default FormSuccess;
