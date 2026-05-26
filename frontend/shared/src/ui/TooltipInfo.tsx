import { PropsWithChildren } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./TooltipPrimitive";

interface TooltipInfoProps extends PropsWithChildren {
  className?: string;
  id?: string;
  title?: string;
}

// Self-wraps in TooltipProvider so it works in any app, including ones that
// don't mount a provider at the root (e.g. the landing page). Radix keeps the
// content open while the pointer is over it, so links inside stay clickable.
const TooltipInfo = ({ children, id, title, className }: TooltipInfoProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            id={id}
            data-skel-static
            aria-label={title ?? "More information"}
            className={`inline-flex items-center justify-center leading-none text-muted ${
              className ?? ""
            }`}
          >
            <svg
              aria-hidden="true"
              className="cursor-pointer block"
              width="16"
              height="16"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.75 7.25C13.75 10.84 10.84 13.75 7.25 13.75C3.66 13.75 0.75 10.84 0.75 7.25C0.75 3.66 3.66 0.75 7.25 0.75C7.42 0.75 7.59999 0.759989 7.76999 0.769989C10.94 1.01999 13.48 3.56001 13.73 6.73001C13.74 6.90001 13.75 7.08 13.75 7.25Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.55328 10.75V5.71H7.95328V10.75H6.55328ZM7.25328 5.06C6.99995 5.06 6.79328 4.98667 6.63328 4.84C6.47328 4.68667 6.39328 4.5 6.39328 4.28C6.39328 4.05333 6.47328 3.86667 6.63328 3.72C6.79328 3.57333 6.99995 3.5 7.25328 3.5C7.50661 3.5 7.71328 3.57333 7.87328 3.72C8.03328 3.86667 8.11328 4.05333 8.11328 4.28C8.11328 4.5 8.03328 4.68667 7.87328 4.84C7.71328 4.98667 7.50661 5.06 7.25328 5.06Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-2 p-3">
            {title && (
              <div className="font-semibold text-[13px] leading-none text-muted">
                {title}
              </div>
            )}
            <div className="font-light text-[12px] leading-[16px] text-muted">
              {children}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TooltipInfo;
