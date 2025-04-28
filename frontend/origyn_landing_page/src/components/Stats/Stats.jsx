import React from "react";
import StatsItem from "../StatsItem/StatsItem";
import styles from "./Stats.module.css";

const Stats = ({ items }) => {
  return (
    <div className={styles.statsContainer}>
      {items.map((item, index) => (
        <React.Fragment key={item.title}>
          <StatsItem title={item.title} value={item.value} />
          {index < items.length - 1 && <div className={styles.divider} />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stats;
