import { useNavigate } from "react-router-dom";
import styles from "./UseCases.module.css";

const UseCaseCard = ({ title, description, image, height, link }) => {
  const navigate = useNavigate();

  return (
    <div className={styles.cardWrapper}>
      <div className={`${styles.card}`} style={height ? { height } : undefined}>
        <img src={image} alt={title} className={styles.cardImage} />
        <div className={styles.cardOverlay}>
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDescription}>{description}</p>
            <button
              className={styles.discoverButton}
              onClick={() => {
                localStorage.setItem("scrollPosition", "use-cases");
                window.scrollTo(0, 0);
                navigate(link);
              }}
            >
              Discover more
            </button>
          </div>
        </div>
      </div>
      <h3 className={styles.cardTitleBelow}>{title}</h3>
      <div className={styles.mobileContent}>
        <h3 className={styles.mobileTitle}>{title}</h3>
        <button
          className={styles.mobileDiscoverButton}
          onClick={() => {
            localStorage.setItem("scrollPosition", "use-cases");
            window.scrollTo(0, 0);
            navigate(link);
          }}
        >
          Discover more
        </button>
      </div>
    </div>
  );
};

export default UseCaseCard;
