import styles from "./IntegratorProgram.module.css";
import Button from "../Button/Button";

const IntegratorProgram = ({ id }) => {
  return (
    <section className={styles.container} id={id}>
      <div className={styles.leftPanel}>
        <h2 className={styles.title}>
          Integrator <br /> <span className={styles.program}>Program</span>
        </h2>
        <p className={styles.description}>
          The ORIGYN Integrator Program is designed for businesses, platforms,
          and developers looking to integrate ORIGYN's decentralized
          certification infrastructure directly into their services.
          <br />
          <br /> Whether you're a marketplace, supply chain solution, or luxury
          brand, you can offer secure, on-chain asset verification without
          rebuilding the wheel.
        </p>
      </div>

      <div className={styles.rightPanelWrapper}>
        <img
          src="/integrator-program.jpg"
          alt="Integrator Program"
          className={styles.rightPanelImage}
        />
      </div>

      <div className={styles.buttonContainer}>
        <Button
          url="mailto:techsupport@origyn.com"
          styles={{ width: "max-content" }}
          text="Join the Integrator Program"
        />
      </div>
    </section>
  );
};

export default IntegratorProgram;
