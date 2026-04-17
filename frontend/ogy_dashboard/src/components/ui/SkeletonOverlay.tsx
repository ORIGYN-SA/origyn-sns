import { ReactNode } from "react";
import clsx from "clsx";

type SkeletonOverlayProps = {
  loading: boolean;
  children: ReactNode;
  className?: string;
};

const OVERLAY_CLASSES = [
  "pointer-events-none",
  "select-none",
  "animate-pulse",

  "[&_*]:!text-transparent",
  "[&_svg]:!opacity-0",
  "[&_img]:!opacity-0",

  "[&_[data-skel-block]]:!bg-muted/20",
  "[&_[data-skel-block]]:!rounded-xl",

  "[&_span]:!bg-muted/20",
  "[&_span]:!rounded-md",
  "[&_strong]:!bg-muted/20",
  "[&_strong]:!rounded-md",
  "[&_a]:!bg-muted/20",
  "[&_a]:!rounded-md",
  "[&_button]:!bg-muted/20",
  "[&_button]:!rounded-md",
  "[&_p]:!bg-muted/20",
  "[&_p]:!rounded-md",
  "[&_h1]:!bg-muted/20",
  "[&_h1]:!rounded-md",
  "[&_h2]:!bg-muted/20",
  "[&_h2]:!rounded-md",
  "[&_h3]:!bg-muted/20",
  "[&_h3]:!rounded-md",
  "[&_h4]:!bg-muted/20",
  "[&_h4]:!rounded-md",
  "[&_h5]:!bg-muted/20",
  "[&_h5]:!rounded-md",
  "[&_h6]:!bg-muted/20",
  "[&_h6]:!rounded-md",

  "[&_thead_*]:!text-inherit",
  "[&_thead_span]:!bg-transparent",
  "[&_thead_strong]:!bg-transparent",
  "[&_thead_a]:!bg-transparent",
  "[&_thead_button]:!bg-transparent",
  "[&_thead_p]:!bg-transparent",
  "[&_thead_svg]:!opacity-100",
  "[&_thead_img]:!opacity-100",
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
