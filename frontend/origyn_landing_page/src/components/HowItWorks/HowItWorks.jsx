import { useState, useRef } from "react";
import styles from "./HowItWorks.module.css";

const steps = [
  {
    title: "How it works",
    description:
      "Bringing real-world assets on-chain should be simple. ORIGYN's certification process is designed to be secure, decentralized, and easy to use in just three steps: <br /><br />Submit your asset’s metadata and supporting documentation. ORIGYN generates a unique, tamper-proof digital certificate directly on the blockchain, assigning it to the asset and linking it to its rightful owner.",
    rightPanel: {
      step: "STEP 1",
      title: "Mint Your Digital Certificate",
      description: "Upload asset details, mint a blockchain certificate.",
      bg: "/hiw-1.jpg",
    },
  },
  {
    title: "How it works",
    description:
      "Each certificate is cryptographically verifiable. Asset authenticity, provenance, and ownership are validated through ORIGYN's decentralized protocol.",
    rightPanel: {
      step: "STEP 2",
      title: "Verify & Authenticate",
      description: "Ensure asset authenticity and ownership transparency.",
      bg: "/hiw-2.jpg",
    },
  },
  {
    title: "How it works",
    description:
      "Once certified, your asset can be held, transferred, traded, or used within digital ecosystems, from DeFi applications and NFT marketplaces to private transactions and institutional records.",
    rightPanel: {
      step: "STEP 3",
      title: "Transfer & Trace",
      description:
        "Utilize and trace your certified asset for DeFi, resale, or investment.",
      bg: "/hiw-3.jpg",
    },
  },
];

const HowItWorks = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setCurrentStep(steps.length - 1);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      // Prevent click event from firing when swiping
      e.preventDefault();

      if (distance > 0) {
        // Swipe left - go to next step
        nextStep();
      } else {
        // Swipe right - go to previous step
        prevStep();
      }
    }

    // Reset values
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.leftPanel}>
        <div>
          <h2 className={styles.title}>
            How it <br id="works-break" />
            <span>works</span>
          </h2>
          <p
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: steps[currentStep].description }}
          />
        </div>
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

      <div className={styles.rightPanelWrapper} onClick={() => nextStep()}>
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
