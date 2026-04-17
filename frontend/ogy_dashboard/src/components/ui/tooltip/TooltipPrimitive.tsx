import {
  ComponentPropsWithoutRef,
  ElementRef,
  forwardRef,
} from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";

export const TooltipProvider = RadixTooltip.Provider;
export const Tooltip = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;

export const TooltipContent = forwardRef<
  ElementRef<typeof RadixTooltip.Content>,
  ComponentPropsWithoutRef<typeof RadixTooltip.Content>
>(({ className, sideOffset = 8, side = "bottom", ...props }, ref) => (
  <RadixTooltip.Portal>
    <RadixTooltip.Content
      ref={ref}
      side={side}
      sideOffset={sideOffset}
      className={clsx(
        "z-50 max-w-[312px] overflow-hidden rounded-[10px] border border-border-strong bg-surface-1 text-muted shadow-md",
        "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=delayed-open]:zoom-in-95",
        className
      )}
      {...props}
    />
  </RadixTooltip.Portal>
));
TooltipContent.displayName = "TooltipContent";
