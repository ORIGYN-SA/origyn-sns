import { PropsWithChildren } from "react";

interface IBadge extends PropsWithChildren<{
  className?: string;
}> {}

const Badge = ({ children, className = "", ...restProps }: IBadge) => {
  return (
    <div
      className={`inline-flex items-center rounded-full whitespace-nowrap px-0 py-1 ${className}`}
      {...restProps}
    >
      {children}
    </div>
  );
};

export default Badge;
