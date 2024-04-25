import { PropsWithChildren } from "react";

interface IBadge
  extends PropsWithChildren<{
    className?: string;
    colorClassName: string;
    backgoundColorClassName: string;
  }> {}

const Badge = ({
  children,
  className,
  colorClassName,
  backgoundColorClassName,
  ...restProps
}: IBadge) => {
  return (
    <div
      className={`rounded-full px-4 py-2 ${colorClassName} ${className}`}
      {...restProps}
    >
      <div className={`${backgoundColorClassName}`}>{children}</div>
    </div>
  );
};

export default Badge;
