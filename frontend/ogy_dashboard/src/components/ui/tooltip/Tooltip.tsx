import { PropsWithChildren, ReactNode } from "react";
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipTrigger,
} from "./TooltipPrimitive";
import { useTouchTooltip } from "@origyn/shared-ui/ui";

type TooltipProps = PropsWithChildren<{
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}>;

const Tooltip = ({
  content,
  side = "bottom",
  className,
  children,
}: TooltipProps) => {
  const { rootProps, triggerProps } = useTouchTooltip();

  return (
    <TooltipRoot {...rootProps}>
      <TooltipTrigger asChild {...triggerProps}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        <div className="px-3 py-2 text-xs break-all">{content}</div>
      </TooltipContent>
    </TooltipRoot>
  );
};

export default Tooltip;
