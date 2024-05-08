import { Button } from "@components/ui";
import { useClaimAllRewards } from "../../context";

const FormSuccess = () => {
  const { handleClose } = useClaimAllRewards();

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-jade font-semibold">
        Claim all rewards successfull!
      </div>
      <Button onClick={handleClose}>Close</Button>
    </div>
  );
};

export default FormSuccess;
