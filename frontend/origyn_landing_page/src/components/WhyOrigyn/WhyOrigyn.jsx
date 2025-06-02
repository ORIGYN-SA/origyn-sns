import React from "react";
import styles from "./WhyOrigyn.module.css";
import Benefits from "../Benefits/Benefits";

const WhyOrigyn = () => {
  return (
    <div className={styles.container}>
      <div className={styles.titleWithContent}>
        <div className={styles.title}>
          <span className={styles.why}>
            Why <br />
            ORIGYN
          </span>
        </div>
        <div className={styles.subtitle}>
          ORIGYN, Where real-world assets meet blockchain.
        </div>
        <div className={styles.content}>
          ORIGYN is the world's most advanced rwa protocol designed to bring
          real-world assets fully on-chain. from fine art and gold to luxury
          goods and intellectual property.
          <br />
          <br />
          It provides a trustless certification infrastructure that ensures
          authenticity, provenance, and ownership of high-value assets.
        </div>
      </div>
      <Benefits />
    </div>
  );
};

export default WhyOrigyn;
