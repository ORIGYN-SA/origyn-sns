import { getLocalizedText } from "../utils";
import { FieldProps } from "./FieldProps";

const FieldBadge = ({
  data,
  backgroundVariant,
  selectedLanguage,
}: FieldProps) => {
  const backgroundVariantClasses = {
    custom: "text-[#FCFAFA]",
    standard: "text-[#061937]",
  };

  return (
    <div
      className={`leading-wide text-center font-semibold uppercase sm:text-[20px] ${backgroundVariantClasses[backgroundVariant]}`}
    >
      {getLocalizedText(data, selectedLanguage)}
    </div>
  );
};

export default FieldBadge;
