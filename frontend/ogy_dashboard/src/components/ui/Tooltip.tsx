/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
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
  background-color: rgb(var(--color-surface-2)) !important;
  color: rgb(var(--color-content)) !important;
  &.tooltip {
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 90%;
    width: max-content;
  }
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
