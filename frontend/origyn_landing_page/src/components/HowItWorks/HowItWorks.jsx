import { useState } from "react";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "How it works",
    rightPanel: {
      step: "STEP 1",
      title: "Mint Your Digital Certificate",
      description: "Upload asset details, mint a blockchain certificate.",
      bg: "/hiw-1.png",
    },
  },
  {
    title: "How it works",
    rightPanel: {
      step: "STEP 2",
      title: "Verify & Authenticate",
      description: "Ensure asset authenticity and ownership transparency.",
      bg: "/hiw-2.png",
    },
  },
  {
    title: "How it works",
    rightPanel: {
      step: "STEP 3",
      title: "Transfer & Trace",
      description:
        "Utilize and trace your certified asset for DeFi, resale, or investment.",
      bg: "/hiw-3.png",
    },
  },
];

const HowItWorks = () => {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <section className={styles.container}>
      <div className={styles.leftPanel}>
        <h2 className={styles.title}>
          How it
          <br />
          <span>works</span>
        </h2>
        <p className={styles.description}>
          BRINGING REAL-WORLD ASSETS ON-CHAIN SHOULD BE SIMPLE. ORIGYN'S
          CERTIFICATION PROCESS IS DESIGNED TO BE SECURE, DECENTRALIZED, AND
          EASY TO USE IN JUST THREE STEPS:
          <br />
          <br />
          SUBMIT YOUR ASSET'S METADATA AND SUPPORTING DOCUMENTATION. ORIGYN
          GENERATES A UNIQUE, TAMPER-PROOF DIGITAL CERTIFICATE DIRECTLY ON THE
          BLOCKCHAIN, ASSIGNING IT TO THE ASSET AND LINKING IT TO ITS RIGHTFUL
          OWNER.
        </p>
        <div className={styles.indicators}>
          {steps.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${
                index === currentStep ? styles.active : ""
              }`}
              onClick={() => setCurrentStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.rightPanelWrapper}>
        <img
          src={steps[currentStep].rightPanel.bg}
          alt="How it works"
          className={styles.rightPanelImage}
        />
        <div className={styles.rightPanel}>
          <span className={styles.stepLabel}>
            {steps[currentStep].rightPanel.step}
          </span>
          <h3 className={styles.panelTitle}>
            {steps[currentStep].rightPanel.title}
          </h3>
          <p className={styles.panelDescription}>
            {steps[currentStep].rightPanel.description}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
