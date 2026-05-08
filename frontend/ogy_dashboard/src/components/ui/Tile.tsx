import { PropsWithChildren } from "react";

interface TileProps extends PropsWithChildren<{
  className?: string;
}> {}

const Tile = ({ className, children, ...restProps }: TileProps) => {
  return (
    <div
      className={`flex justify-center items-center shrink-0 ${className ?? ""}`}
      {...restProps}
    >
      {children}
    </div>
  );
};

export default Tile;
