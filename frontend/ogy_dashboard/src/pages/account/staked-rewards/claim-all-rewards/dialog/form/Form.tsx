import { Button } from "@components/ui";
import { useClaimAllRewards } from "../../context";

const Form = () => {
  const { principal, claimAmount, handleClaimAllRewards } =
    useClaimAllRewards();

  return (
    <div className="text-center mt-8">
      <div>
        <span>
          You're about to claim
          <span className="font-semibold text-xl"> {claimAmount} OGY</span>
        </span>
      </div>
      <div className="mt-4 text-sm text-content/60">
        The rewards will be sent to your principal
      </div>
      <div className="mt-1 text-sm font-semibold text-content">{principal}</div>
      <Button onClick={handleClaimAllRewards} className="mt-8 w-full">
        Confirm
      </Button>
    </div>
  );
};

export default Form;
