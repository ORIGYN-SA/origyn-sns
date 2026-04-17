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
    clickable?: boolean;
    openOnClick?: boolean;
  }> {}

const StyledTooltip = styled(ReactTooltip)`
  background-color: rgb(var(--color-surface-1)) !important;
  border: 1px solid rgb(var(--color-border-strong)) !important;
  opacity: 1 !important;
  color: rgb(var(--color-muted)) !important;
  z-index: 9;
  border-radius: 10px !important;
  padding: 0 !important;
  transition: opacity 0.15s ease-in-out !important;
  transform: none !important;
`;

const Tooltip = ({
  className,
  id,
  place = "bottom",
  children,
  clickable = false,
  ...restProps
}: TooltipProps) => {
  return (
    <StyledTooltip
      className={`${className}`}
      id={id}
      place={place}
      clickable={clickable}
      noArrow
      float={false}
      offset={8}
      globalCloseEvents={{ scroll: true, resize: true, escape: true }}
      {...restProps}
    >
      {children}
    </StyledTooltip>
  );
};

export default Tooltip;
