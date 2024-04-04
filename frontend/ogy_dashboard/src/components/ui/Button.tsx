import { PropsWithChildren } from "react";

interface ButtonProps
  extends PropsWithChildren<{
    className?: string;
  }> {}

const Button = ({ className, children, ...restProps }: ButtonProps) => {
  return (
    <button
      className={`bg-content dark:bg-background text-background dark:text-content dark:border-content dark:border py-2 px-4 font-semibold rounded-full ${className}`}
      {...restProps}
    >
      {children}
    </button>
  );
};

export default Button;
