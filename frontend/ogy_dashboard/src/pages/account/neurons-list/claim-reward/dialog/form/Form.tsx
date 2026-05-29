import { Button } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import { useClaimReward } from "../../context";
import { Buffer } from "buffer";

const Form = () => {
  const t = useT();
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
          {t("account.neurons.claim.aboutToClaim")}
          <span className="font-semibold text-xl"> {claimAmount} OGY</span>
        </span>
      </div>
      <div className="mt-4 text-sm text-content/60">
        {t("account.neurons.claim.sentToPrincipal")}
      </div>
      {/* Principal is an inherently-LTR identifier. */}
      <div dir="ltr" className="mt-1 text-sm font-semibold text-content">
        {principal}
      </div>
      <Button onClick={handleClaimReward} className="mt-8 w-full">
        {t("common.confirm")}
      </Button>
    </div>
  );
};

export default Form;
