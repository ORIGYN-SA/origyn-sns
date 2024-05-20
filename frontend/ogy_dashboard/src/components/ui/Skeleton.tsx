import Skeleton from "react-loading-skeleton";
import styled from "styled-components";
import "react-loading-skeleton/dist/skeleton.css";

const StyledSkeleton = styled.div`
  .react-loading-skeleton {
    --base-color: rgba(var(--color-accent) / 0.08);
    --highlight-color: rgba(var(--color-accent) / 0.4);
  }
`;

const SkeletonCmp = ({
  className,
  count,
}: {
  className?: string;
  count?: number;
}) => {
  return (
    <StyledSkeleton className={className}>
      <Skeleton count={count ?? 1} />
    </StyledSkeleton>
  );
};

export default SkeletonCmp;
