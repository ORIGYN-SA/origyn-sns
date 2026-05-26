import { ReactNode } from "react";
import clsx from "clsx";

type SkeletonOverlayProps = {
  loading: boolean;
  children: ReactNode;
  className?: string;
};

const OVERLAY_CLASSES = [
  "select-none",

  "[&_[data-skel-hide]]:!invisible",

  "[&_svg:not(thead_svg):not([data-skel-static]_svg):not([data-skel-static])]:!opacity-0",

  "[&_[data-skel-block]]:!bg-muted/20",
  "[&_[data-skel-block]]:!rounded-xl",

  "[&_span:not(thead_span):not([data-skel-static]_span):not([data-skel-static])]:!text-transparent",
  "[&_span:not(thead_span):not([data-skel-static]_span):not([data-skel-static])]:!bg-muted/20",
  "[&_span:not(thead_span):not([data-skel-static]_span):not([data-skel-static])]:!rounded-md",
  "[&_strong:not(thead_strong):not([data-skel-static]_strong):not([data-skel-static])]:!text-transparent",
  "[&_strong:not(thead_strong):not([data-skel-static]_strong):not([data-skel-static])]:!bg-muted/20",
  "[&_strong:not(thead_strong):not([data-skel-static]_strong):not([data-skel-static])]:!rounded-md",
  "[&_a:not(thead_a):not([data-skel-static]_a):not([data-skel-static])]:!text-transparent",
  "[&_a:not(thead_a):not([data-skel-static]_a):not([data-skel-static])]:!bg-muted/20",
  "[&_a:not(thead_a):not([data-skel-static]_a):not([data-skel-static])]:!rounded-md",
  "[&_button:not(thead_button):not([data-skel-static]_button):not([data-skel-static])]:!text-transparent",
  "[&_button:not(thead_button):not([data-skel-static]_button):not([data-skel-static])]:!bg-muted/20",
  "[&_button:not(thead_button):not([data-skel-static]_button):not([data-skel-static])]:!rounded-md",
  "[&_p:not(thead_p):not([data-skel-static]_p):not([data-skel-static])]:!text-transparent",
  "[&_p:not(thead_p):not([data-skel-static]_p):not([data-skel-static])]:!bg-muted/20",
  "[&_p:not(thead_p):not([data-skel-static]_p):not([data-skel-static])]:!rounded-md",
  "[&_h1:not(thead_h1):not([data-skel-static]_h1):not([data-skel-static])]:!text-transparent",
  "[&_h1:not(thead_h1):not([data-skel-static]_h1):not([data-skel-static])]:!bg-muted/20",
  "[&_h1:not(thead_h1):not([data-skel-static]_h1):not([data-skel-static])]:!rounded-md",
  "[&_h2:not(thead_h2):not([data-skel-static]_h2):not([data-skel-static])]:!text-transparent",
  "[&_h2:not(thead_h2):not([data-skel-static]_h2):not([data-skel-static])]:!bg-muted/20",
  "[&_h2:not(thead_h2):not([data-skel-static]_h2):not([data-skel-static])]:!rounded-md",
  "[&_h3:not(thead_h3):not([data-skel-static]_h3):not([data-skel-static])]:!text-transparent",
  "[&_h3:not(thead_h3):not([data-skel-static]_h3):not([data-skel-static])]:!bg-muted/20",
  "[&_h3:not(thead_h3):not([data-skel-static]_h3):not([data-skel-static])]:!rounded-md",
  "[&_h4:not(thead_h4):not([data-skel-static]_h4):not([data-skel-static])]:!text-transparent",
  "[&_h4:not(thead_h4):not([data-skel-static]_h4):not([data-skel-static])]:!bg-muted/20",
  "[&_h4:not(thead_h4):not([data-skel-static]_h4):not([data-skel-static])]:!rounded-md",
  "[&_h5:not(thead_h5):not([data-skel-static]_h5):not([data-skel-static])]:!text-transparent",
  "[&_h5:not(thead_h5):not([data-skel-static]_h5):not([data-skel-static])]:!bg-muted/20",
  "[&_h5:not(thead_h5):not([data-skel-static]_h5):not([data-skel-static])]:!rounded-md",
  "[&_h6:not(thead_h6):not([data-skel-static]_h6):not([data-skel-static])]:!text-transparent",
  "[&_h6:not(thead_h6):not([data-skel-static]_h6):not([data-skel-static])]:!bg-muted/20",
  "[&_h6:not(thead_h6):not([data-skel-static]_h6):not([data-skel-static])]:!rounded-md",
].join(" ");

const SkeletonOverlay = ({
  loading,
  children,
  className,
}: SkeletonOverlayProps) => {
  if (!loading) return <>{children}</>;

  return (
    <div aria-busy="true" className={clsx(OVERLAY_CLASSES, className)}>
      {children}
    </div>
  );
};

export default SkeletonOverlay;
