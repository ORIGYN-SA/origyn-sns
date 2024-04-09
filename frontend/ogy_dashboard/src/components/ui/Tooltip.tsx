import { PropsWithChildren } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import styled from "styled-components";

interface TooltipProps
  extends PropsWithChildren<{
    className?: string;
    id: string;
    place?: string;
  }> {}

const StyledTooltip = styled(ReactTooltip)`
  background-color: rgb(var(--color-content-1)) !important;
  color: rgb(var(--color-surface-1)) !important;
`;

const Tooltip = ({
  className,
  id,
  place = "bottom",
  children,
  ...restProps
}: TooltipProps) => {
  return (
    <StyledTooltip
      className={`${className}`}
      id={id}
      place={place}
      {...restProps}
    >
      {children}
    </StyledTooltip>
  );
};

export default Tooltip;
