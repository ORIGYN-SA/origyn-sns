import styles from "./UtilityCard.module.scss";

const UtilityCard = ({ title, description, icon, isStaking }) => {
  return (
    <div className={styles.card + (isStaking ? ` ${styles.stakingCard}` : "")}>
      <div className={styles.iconWrapper}>
        <img src={icon} alt={title} className={styles.icon} />
      </div>
      <div>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>
    </div>
  );
};

export default UtilityCard;
