import { getLocalizedText } from "../utils";
import { FieldProps } from "./FieldProps";

const FieldText = ({
  item,
  data,
  backgroundVariant,
  tabVariant,
  selectedLanguage,
}: FieldProps) => {
  const backgroundVariantClasses =
    tabVariant === "certificate"
      ? {
          custom: { label: "text-[#FCFAFA]", value: "text-[#FCFAFA]" },
          standard: { label: "text-[#69737C]", value: "text-[#222526]" },
        }
      : {
          custom: {
            label: "text-xs text-[#E1E1E1] text-left",
            value: "text-white",
          },
          standard: {
            label: "text-xs text-[#E1E1E1] text-left",
            value: "text-white",
          },
        };

  const valueSizeClasses =
    tabVariant === "certificate"
      ? {
          sm: "text-[20px] font-semibold",
          md: "text-[24px] font-semibold leading-[32px]",
          lg: "text-[36px] leading-[36px] sm:text-[56px] sm:leading-[56px] font-extralight",
        }
      : {
          sm: "text-sm sm:font-extralight",
          md: "sm:font-extralight",
          lg: "text-lg sm:font-extralight",
        };

  return (
    <div
      className={
        tabVariant === "certificate"
          ? "text-center"
          : "flex flex-col items-center justify-between gap-2 border-b border-[#efece340] py-4 sm:flex-row sm:text-right lg:gap-12"
      }
    >
      <div
        className={`text-sm tracking-wider uppercase ${backgroundVariantClasses[backgroundVariant]["label"]}`}
      >
        {item.label}
      </div>
      <div
        className={`${valueSizeClasses[item.size || "md"]} ${backgroundVariantClasses[backgroundVariant]["value"]}`}
      >
        {getLocalizedText(data, selectedLanguage) || "-"}
      </div>
    </div>
  );
};

export default FieldText;
