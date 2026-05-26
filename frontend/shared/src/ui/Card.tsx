import { FC, PropsWithChildren, HTMLAttributes } from "react";

interface CardProps extends PropsWithChildren<HTMLAttributes<HTMLDivElement>> {
  className?: string;
}

interface BorderBottomProps {
  className?: string;
  color?: string;
}

const Card: FC<CardProps> & { BorderBottom: FC<BorderBottomProps> } = ({
  className,
  children,
  ...restProps
}) => {
  return (
    <div
      className={`relative bg-surface border border-border p-6 rounded-xl ${className}`}
      {...restProps}
    >
      {children}
    </div>
  );
};

Card.BorderBottom = ({ className, color }: BorderBottomProps) => {
  return (
    <div
      style={color ? { backgroundColor: color } : undefined}
      className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full ${className ?? ""}`}
    />
  );
};

export default Card;
