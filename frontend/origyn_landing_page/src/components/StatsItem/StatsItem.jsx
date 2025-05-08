import React from "react";
import styles from "./StatsItem.module.css";

const StatsItem = ({ title, value }) => {
  return (
    <div className={styles.statsItem}>
      <div className={styles.valueRow}>
        <div className={styles.value}>
          {value === undefined ? <div className={styles.skeleton} /> : value}
        </div>
      </div>
      <div className={styles.title}>{title}</div>
    </div>
  );
};

export default StatsItem;
