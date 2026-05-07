interface SkeletonProps {
  className?: string;
  count?: number;
  height?: string | number;
}

const Skeleton = ({ className, count = 1, height }: SkeletonProps) => {
  const style = height !== undefined ? { height } : undefined;
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="block rounded animate-pulse bg-[rgb(var(--color-accent)/0.2)] my-1 h-4 last:mb-0 first:mt-0"
          style={style}
        />
      ))}
    </div>
  );
};

export default Skeleton;
