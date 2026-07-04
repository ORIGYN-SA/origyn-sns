import { ImgHTMLAttributes } from "react";
import { getNonRawUrl } from "./utils";

interface CanisterImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

// <img> wrapper that swaps .raw.icp0.io URLs for the boundary-node URL:
// chunked assets (>2MB) fail on the raw endpoint with HTTP/2 errors that
// don't reliably fire onError, so the non-raw URL is used proactively.
const CanisterImage = ({ src, ...props }: CanisterImageProps) => (
  <img src={getNonRawUrl(src) ?? src} {...props} />
);

export default CanisterImage;
