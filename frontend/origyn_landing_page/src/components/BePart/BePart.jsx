import Button from "@components/Button/Button";
import styles from "./BePart.module.scss";
const BePart = () => {
  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <h2 className={styles.titleDesktop}>
          Be part of
          <br />
          <span className={styles.italic}>decision-making</span>
        </h2>
        <h2 className={styles.titleMobile}>
          Be part of
          <br />
          <span className={styles.italic}>
            Decision <br />
            Making
          </span>
        </h2>
        <Button
          url="https://t.me/origynfoundation"
          text="Join ORIGYN DAO"
          target="_blank"
        />
      </div>
      <div className={styles.origynWhiteLogoContainer}>
        <div className={styles.gradientBackground} />
        <img
          className={styles.origynWhiteLogo}
          src="/ogy_white.svg"
          alt="ORIGYN White Logo"
        />
      </div>
    </div>
  );
};

export default BePart;
