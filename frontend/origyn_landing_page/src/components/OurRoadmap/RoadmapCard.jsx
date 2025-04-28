import styles from "./RoadmapCard.module.css";

const RoadmapCard = ({ title, image, description, when }) => {
  return (
    <div className={styles.cardWrapper}>
      <div className={styles.left}>
        <div>
          <h1 className={styles.leftTitle}>{title}</h1>
          <p className={styles.leftDescription}>{description}</p>
        </div>
        <div className={styles.badge}>{when}</div>
      </div>
      <div className={styles.right}>
        <img src={image} alt={title} className={styles.rightImage} />
      </div>
    </div>
  );
};

export default RoadmapCard;
