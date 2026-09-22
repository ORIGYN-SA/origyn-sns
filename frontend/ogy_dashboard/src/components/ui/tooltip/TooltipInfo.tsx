import { PropsWithChildren } from "react";
import { TooltipInfo as SharedTooltipInfo } from "@origyn/shared-ui/ui";

interface TooltipInfoProps extends PropsWithChildren {
  className?: string;
  id?: string;
  clickable?: boolean;
  openOnClick?: boolean;
  title?: string;
}

const TooltipInfo = ({ children, id, title, className }: TooltipInfoProps) => (
  <SharedTooltipInfo id={id} title={title} className={className}>
    {children}
  </SharedTooltipInfo>
);

export default TooltipInfo;
