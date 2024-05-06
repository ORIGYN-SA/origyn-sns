import { MouseEventHandler, PropsWithChildren } from "react";

interface ButtonProps
  extends PropsWithChildren<{
    className?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
  }> {}

const Button = ({
  className,
  children,
  disabled = false,
  ...restProps
}: ButtonProps) => {
  return (
    <button
      disabled={disabled}
      className={`bg-content text-background py-2 px-4 font-semibold rounded-full ${className}`}
      {...restProps}
    >
      {children}
    </button>
  );
};

export default Button;
