import React from "react";
import Tooltip from "./Tooltip";

const TooltipInfo = ({ children, id = "tootltip-id", clickable = false }) => {
  return (
    <div>
      <img
        style={{
          verticalAlign: "middle",
          height: "16px",
          width: "16px",
          filter:
            "brightness(0) saturate(100%) invert(45%) sepia(8%) saturate(1000%) hue-rotate(180deg) brightness(95%) contrast(86%)",
        }}
        data-tooltip-id={id}
        src="info-icon.png"
      />
      <Tooltip id={id} clickable={clickable}>
        {children}
      </Tooltip>
    </div>
  );
};

export default TooltipInfo;
