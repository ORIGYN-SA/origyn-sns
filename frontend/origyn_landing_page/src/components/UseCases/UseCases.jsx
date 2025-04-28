import styles from "./UseCases.module.css";
import UseCaseCard from "./UseCaseCard";

const useCases = [
  {
    title: "Art",
    image: "/uc-1.png",
    position: "top",
    height: "100%",
  },
  {
    title: "Diamonds",
    image: "/uc-2.png",
    position: "bottom",
  },
  {
    title: "Gold",
    image: "/uc-3.jpeg",
    height: "100%",
    position: "top",
  },
  {
    title: "Made In Italy",
    image: "/uc-5.png",
    position: "top",
  },
];

const UseCases = ({ id }) => {
  return (
    <section className={styles.container} id={id}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Use <span>Cases</span>
        </h2>
        <p className={styles.description}>
          ORIGYN's protocol is built to serve a wide range of industries where
          trust, provenance, and authenticity are critical. Below are some of
          the key sectors already leveraging ORIGYN's certification
          infrastructure.
        </p>
      </div>

      <div className={styles.grid}>
        {useCases.map((useCase, index) => (
          <UseCaseCard key={index} {...useCase} />
        ))}
      </div>
    </section>
  );
};

export default UseCases;
