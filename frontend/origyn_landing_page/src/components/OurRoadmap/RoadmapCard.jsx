import { forwardRef } from "react";
import styles from "./RoadmapCard.module.css";

const RoadmapCard = forwardRef(
  ({ title, titleSpan, image, description, when }, ref) => {
    const isLongTitle = title.length > 35;
    const titleClass = isLongTitle ? styles.leftTitleSmall : styles.leftTitle;

    return (
      <div className={styles.cardWrapper} ref={ref}>
        <div className={styles.left}>
          <div>
            <h1 className={titleClass}>
              {title} <span>{titleSpan}</span>
            </h1>
            <p className={styles.leftDescription}>{description}</p>
          </div>
          <div className={styles.badge}>{when}</div>
        </div>
        <div className={styles.right}>
          <img src={image} alt={title} className={styles.rightImage} />
        </div>
      </div>
    );
  },
);

export default RoadmapCard;
