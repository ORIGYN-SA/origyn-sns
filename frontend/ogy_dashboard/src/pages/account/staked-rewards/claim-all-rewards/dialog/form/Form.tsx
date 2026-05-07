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
    <>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="text-[22px] font-semibold leading-none text-content">
          You're about to claim {claimAmount} OGY
        </div>
        <div className="text-[13px] leading-snug text-muted max-w-[340px]">
          The rewards will be sent to your principal
        </div>
      </div>
      <div className="rounded-2xl border border-border-strong bg-surface-faint px-4 py-3 text-center text-[13px] leading-snug text-content break-all">
        {principal}
      </div>
      <Button
        onClick={handleClaimAllRewards}
        className="w-full !py-0 text-[14px] leading-[44px]"
      >
        Confirm
      </Button>
    </>
  );
};

export default Form;
