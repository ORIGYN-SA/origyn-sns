import React from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import styles from "./Tooltip.module.scss";

const Tooltip = ({
  className,
  id,
  place = "bottom",
  children,
  clickable = false,
  ...restProps
}) => {
  return (
    <ReactTooltip
      className={`${styles.tooltip} ${className || ""}`}
      id={id}
      place={place}
      clickable={clickable}
      delayShow={300}
      {...restProps}
    >
      {children}
    </ReactTooltip>
  );
};

export default Tooltip;
