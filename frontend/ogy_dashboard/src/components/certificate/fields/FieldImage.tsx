import CanisterImage from "../CanisterImage";
import { FileReference } from "../types";
import { FieldProps } from "./FieldProps";
import FieldGallery from "./FieldGallery";

const FieldImage = (props: FieldProps) => {
  const { data, tabVariant } = props;

  const files = data as FileReference[];

  if (!files || files.length === 0) return null;
  if (!files[0] || !files[0].path) return null;

  if (tabVariant === "certificate") {
    const file = files[0];

    return (
      <CanisterImage
        src={file.path}
        alt=""
        loading="lazy"
        className="mx-auto h-auto max-h-[120px] w-auto max-w-[180px] object-contain sm:max-h-[130px] sm:max-w-[240px] md:max-h-[150px] md:max-w-[300px] lg:max-w-[420px]"
      />
    );
  }

  return <FieldGallery {...props} />;
};

export default FieldImage;
