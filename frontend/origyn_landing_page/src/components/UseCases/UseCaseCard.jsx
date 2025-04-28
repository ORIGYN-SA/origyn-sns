import styles from "./UseCases.module.css";

const UseCaseCard = ({ title, image, height, position }) => {
  return (
    <div className={styles.cardWrapper}>
      <div
        className={`${styles.card} ${styles[position]}`}
        style={height ? { height } : undefined}
      >
        <img src={image} alt={title} className={styles.cardImage} />
        <h3 className={styles.cardTitle}>{title}</h3>
      </div>
    </div>
  );
};

export default UseCaseCard;
