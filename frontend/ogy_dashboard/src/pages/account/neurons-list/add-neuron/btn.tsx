import { Button } from "@components/ui";
import { useT } from "@i18n/LocaleContext";
import { useAddNeuron } from "./context";

const BtnAddNeuron = () => {
  const t = useT();
  const { handleShow } = useAddNeuron();
  return (
    <Button
      onClick={handleShow}
      className="min-w-fit ms-auto md:ms-0 !px-[25px] !py-0 text-[14px] leading-[40px]"
    >
      {t("account.neurons.add.button")}
    </Button>
  );
};

export default BtnAddNeuron;
