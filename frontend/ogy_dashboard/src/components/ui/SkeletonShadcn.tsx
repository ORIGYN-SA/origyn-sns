import { HTMLAttributes } from "react";
import clsx from "clsx";

const SkeletonShadcn = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={clsx("animate-pulse rounded-md bg-muted/20", className)}
      {...props}
    />
  );
};

export default SkeletonShadcn;
