import CanisterImage from "../CanisterImage";
import { FileReference } from "../types";
import { FieldProps } from "./FieldProps";

const FieldSignature = ({
  item,
  data,
  tabVariant,
  backgroundVariant,
}: FieldProps) => {
  const backgroundVariantClasses =
    tabVariant === "certificate"
      ? { custom: "text-[#FCFAFA]", standard: "text-[#222526]" }
      : { custom: "text-white", standard: "text-white" };

  const files = data as FileReference[];

  if (!files || files.length === 0) return null;
  if (!files[0] || !files[0].path) return null;
  const file = files[0];

  return (
    <div>
      <CanisterImage
        src={file.path}
        alt=""
        loading="lazy"
        className="order-1 h-auto max-h-[100px] w-full max-w-[200px] border-b border-[#e1e1e1] object-contain md:max-h-[150px] md:max-w-[300px] lg:max-w-[420px]"
      />
      <div
        className={`mt-2 text-center text-sm tracking-wider uppercase ${backgroundVariantClasses[backgroundVariant]}`}
      >
        {item.label}
      </div>
    </div>
  );
};

export default FieldSignature;
