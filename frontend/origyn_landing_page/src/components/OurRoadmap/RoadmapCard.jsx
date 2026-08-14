import { forwardRef } from "react";
import styles from "./RoadmapCard.module.scss";

const RoadmapCard = forwardRef(
  ({ title, titleSpan, titleSmall, upcoming, image, description, when }, ref) => {
    const headline = [title, titleSpan].filter(Boolean).join(" ");
    const fullTitle = [headline, titleSmall].filter(Boolean).join(" ");
    // The card is a fixed height, so a long translation has to step down a size
    // rather than overflow it. titleSmall is already a step down, so it doesn't count.
    const isLongTitle = headline.length > 35;
    const titleClass = [
      isLongTitle ? styles.leftTitleSmall : styles.leftTitle,
      upcoming ? styles.upcoming : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.cardWrapper} ref={ref}>
        <div className={styles.left}>
          <div>
            <h1 className={titleClass}>
              {title} <span>{titleSpan}</span>
              {titleSmall && (
                <span className={styles.titleSmall}> {titleSmall}</span>
              )}
            </h1>
            <p className={styles.leftDescription}>{description}</p>
          </div>
          <div className={styles.badge}>{when}</div>
        </div>
        <div className={styles.right}>
          <img
            src={image}
            alt={fullTitle}
            className={styles.rightImage}
          />
        </div>
      </div>
    );
  },
);

export default RoadmapCard;
