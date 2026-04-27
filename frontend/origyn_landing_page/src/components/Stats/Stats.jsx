import React, { useState } from "react";
import { useSwipeable } from "react-swipeable";
import StatsItem from "@components/StatsItem/StatsItem";
import useIsMobile from "@/hooks/useIsMobile";
import styles from "./Stats.module.scss";

const Stats = ({ items }) => {
  const { isMobile } = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      setIsDragging(true);
      setDragOffset(e.deltaX);
    },
    onSwipedLeft: () => {
      setIsDragging(false);
      setDragOffset(0);
      setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    },
    onSwipedRight: () => {
      setIsDragging(false);
      setDragOffset(0);
      setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    },
    onSwiped: () => {
      setIsDragging(false);
      setDragOffset(0);
    },
    preventScrollOnSwipe: true,
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

  const trackTransform = `translateX(calc(10% - ${currentIndex} * (80% + 28px) + ${dragOffset}px))`;

  return (
    <div className={styles.mobileWrapper}>
      <div {...handlers} className={styles.carouselWrapper}>
        <div
          className={styles.carouselTrack}
          style={{
            transform: trackTransform,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        >
          {items.map((item, index) => (
            <div key={index} className={styles.cardSlide}>
              <div className={styles.statsContainer}>
                <StatsItem
                  title={item.title}
                  value={item.value}
                  tooltip={item.tooltip}
                  tooltipTitle={item.tooltipTitle}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.dotsContainer}>
        {items.map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ""}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Stats;
