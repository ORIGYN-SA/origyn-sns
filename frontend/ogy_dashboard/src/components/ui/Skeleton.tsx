import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const SkeletonCmp = ({
  className,
  count = 1,
  height = undefined,
}: {
  className?: string;
  count?: number;
  height?: string | number;
}) => (
  <div className={className}>
    <Skeleton
      count={count}
      height={height}
      baseColor="rgba(var(--color-accent) / 0.08)"
      highlightColor="rgba(var(--color-accent) / 0.4)"
    />
  </div>
);

export default SkeletonCmp;
