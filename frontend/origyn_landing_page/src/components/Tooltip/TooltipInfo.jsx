import React from "react";
import Tooltip from "./Tooltip";

const TooltipInfo = ({ children, id = "tootltip-id", clickable = false }) => {
  return (
    <span
      style={{ display: "inline-block", position: "relative", top: "2.5px" }}
    >
      <img
        style={{
          height: "16px",
          width: "16px",
          marginLeft: "4px",
          opacity: "0.85",
          filter:
            "brightness(0) saturate(5%) invert(60%) sepia(3%) saturate(5%) hue-rotate(180deg) brightness(100%) contrast(70%)",
        }}
        data-tooltip-id={id}
        src="info-icon.png"
      />
      <Tooltip id={id} clickable={clickable}>
        {children}
      </Tooltip>
    </span>
  );
};

export default TooltipInfo;
