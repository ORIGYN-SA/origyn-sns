import { PropsWithChildren } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import Tooltip from "./Tooltip";

interface TooltipInfoProps extends PropsWithChildren {
  className?: string;
  id?: string;
}

const TooltipInfo = ({ children, id = "tootltip-id" }: TooltipInfoProps) => {
  return (
    <div>
      <InformationCircleIcon
        className="h-6 w-6 text-content"
        data-tooltip-id={id}
      />
      <Tooltip id={id} className="max-w-64">
        {children}
      </Tooltip>
    </div>
  );
};

export default TooltipInfo;
