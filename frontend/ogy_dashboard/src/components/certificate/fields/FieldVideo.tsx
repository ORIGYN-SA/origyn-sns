import { FileReference } from "../types";
import { FieldProps } from "./FieldProps";

const FieldVideo = ({ data }: FieldProps) => {
  const files = data as FileReference[];

  if (!files || files.length === 0) return null;
  if (!files[0] || !files[0].path) return null;

  const video = files[0];

  return (
    <div className="mx-auto max-h-[150px] max-w-[960px]">
      <video controls className="mx-auto max-h-[150px] max-w-full">
        <source src={video.path} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default FieldVideo;
