import { PropsWithChildren } from "react";

interface TileProps
  extends PropsWithChildren<{
    className?: string;
  }> {}

const Tile = ({ className, children, ...restProps }: TileProps) => {
  return (
    <div
      className={`bg-surface-2 flex justify-center items-center shrink-0 w-12 h-12 rounded-full ${className}`}
      {...restProps}
    >
      {children}
    </div>
  );
};

export default Tile;
