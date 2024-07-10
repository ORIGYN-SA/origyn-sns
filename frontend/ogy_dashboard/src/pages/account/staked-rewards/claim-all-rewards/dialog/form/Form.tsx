import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@components/ui";
import { useClaimAllRewards } from "../../context";
import { Buffer } from "buffer";

const Form = () => {
  const queryClient = useQueryClient();
  const { principal, claimAmount, neuronIds, mutation } = useClaimAllRewards();

  const handleClaimAllRewards = () => {
    neuronIds.forEach((neuronId) => {
      mutation.mutate(
        {
          neuronId: { id: [...Uint8Array.from(Buffer.from(neuronId, "hex"))] },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userListNeuronsAll"] });
            queryClient.invalidateQueries({
              queryKey: ["getNeuronClaimBalance"],
            });
          },
        }
      );
    });
  };

  return (
    <div className="text-center">
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
