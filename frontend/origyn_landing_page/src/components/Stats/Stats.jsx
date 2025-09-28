import React, { useState, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import StatsItem from "../StatsItem/StatsItem";
import styles from "./Stats.module.css";

const Stats = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile) {
        setCurrentIndex((prevIndex) =>
          prevIndex === items.length - 1 ? 0 : prevIndex + 1
        );
      }
    },
    onSwipedRight: () => {
      if (isMobile) {
        setCurrentIndex((prevIndex) =>
          prevIndex === 0 ? items.length - 1 : prevIndex - 1
        );
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  if (!isMobile) {
    return (
      <div className={styles.statsContainer}>
        {items.map((item, index) => (
          <React.Fragment key={item.title}>
            <StatsItem
              title={item.title}
              value={item.value}
              tooltip={item.tooltip}
              tooltipTitle={item.tooltipTitle}
            />
            {index < items.length - 1 && <div className={styles.divider} />}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.statsContainer}>
      <div {...handlers} className={styles.swipeContainer}>
        <StatsItem
          title={items[currentIndex].title}
          value={items[currentIndex].value}
          tooltip={items[currentIndex].tooltip}
          tooltipTitle={items[currentIndex].tooltipTitle}
        />
      </div>
      <div className={styles.dotsContainer}>
        {items.map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${
              index === currentIndex ? styles.activeDot : ""
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Stats;
