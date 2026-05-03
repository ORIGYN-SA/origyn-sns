import styles from "../UseCasesPage.module.scss";
import UseCasesSlideshow from "./UseCasesSlideshow";

const UseCaseMobile = ({ caseData }) => {
  return (
    <div className={styles.mobileContainer}>
      {caseData.map((item, index) => (
        <div key={index} className={styles.mobileItem}>
          {item.title && <h1 className={styles.mobileTitle}>{item.title}</h1>}
          <p
            className={styles.mobileDescription}
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
          <div className={styles.mobileImageContainer}>
            <UseCasesSlideshow images={item.images} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default UseCaseMobile;
