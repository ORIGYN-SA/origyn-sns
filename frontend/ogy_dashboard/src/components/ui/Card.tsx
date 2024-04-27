import { FC, PropsWithChildren } from "react";
import styled from "styled-components";

const StyledBorderBottom = styled.div`
  background-color: ${({ color }) => color};
`;

interface CardProps
  extends PropsWithChildren<{
    className?: string;
  }> {}

interface BorderBottomProps {
  className?: string;
  color?: string;
}

const Card: FC<CardProps> & { BorderBottom: FC<BorderBottomProps> } = ({
  className,
  children,
}) => {
  return (
    <div
      className={`relative bg-surface border border-border p-6 rounded-xl ${className}`}
    >
      {children}
    </div>
  );
};

Card.BorderBottom = ({ className, color }: BorderBottomProps) => {
  return (
    <StyledBorderBottom
      color={color}
      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-11/12 rounded-full ${className}`}
    ></StyledBorderBottom>
  );
};

export default Card;
