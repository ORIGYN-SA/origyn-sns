import React from "react";
import TooltipInfo from "../Tooltip/TooltipInfo";
import styles from "./StatsItem.module.css";

const StatsItem = ({ title, value, tooltip, tooltipTitle }) => {
  return (
    <div className={styles.statsItem}>
      <div className={styles.valueRow}>
        <div className={styles.value}>
          {value === undefined ? <div className={styles.skeleton} /> : value}
        </div>
      </div>
      <div className={styles.titleRow}>
        <div className={styles.title}>{title}</div>
        {tooltip && (
          <TooltipInfo
            id={`tooltip-${title.replace(/\s+/g, "-").toLowerCase()}`}
          >
            {tooltipTitle || title}
            <br />
            {tooltip}
          </TooltipInfo>
        )}
      </div>
    </div>
  );
};

export default StatsItem;
