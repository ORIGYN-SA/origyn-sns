import { Button } from "@components/ui";
import { useClaimReward } from "../../context";
import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

const Form = () => {
  const { principal, claimAmount, neuronId, mutation } = useClaimReward();

  const handleClaimReward = () => {
    const { mutate: claimReward } = mutation;
    claimReward({
      neuronId: { id: [...Uint8Array.from(Buffer.from(neuronId, "hex"))] },
    });
  };
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
      <Button onClick={handleClaimReward} className="mt-8 w-full">
        Confirm
      </Button>
    </div>
  );
};

export default Form;
