import { useState, useRef } from "react";
import styles from "./HowItWorks.module.scss";
import { useT } from "@/i18n/LocaleContext";

// Step visuals (number, background image, icon SVG) are static — text comes
// from the i18n catalog and is merged at render time.
const stepVisuals = [
  {
    step: "01",
    bg: "/hiw-1.jpg",
    icon: (
      <svg
        width="62"
        height="66"
        viewBox="0 0 62 66"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.93674 0H44.1265C49.0342 0 53.0633 4.0642 53.0633 9.01474V22.4828C51.8846 22.2018 50.6416 22.0504 49.3771 22.0504C40.6333 22.0504 33.5396 29.206 33.5396 38.0262C33.5396 46.8464 35.6827 47.2139 39.0688 50.1539V62.1087H8.93674C4.02904 62.1087 0 58.0445 0 53.094V9.01474C0 4.0642 4.02904 0 8.93674 0ZM56.4708 52.2941V66L49.3771 60.79L42.2834 66V52.2941C44.4265 53.375 46.8268 53.9803 49.3771 53.9803C51.9274 53.9803 54.3491 53.375 56.4708 52.2941ZM49.3771 25.2932C56.3422 25.2932 62 31.0003 62 38.0262C62 45.0521 56.3422 50.7593 49.3771 50.7593C42.412 50.7593 36.7542 45.0521 36.7542 38.0262C36.7542 31.0003 42.412 25.2932 49.3771 25.2932ZM12.3443 18.1592C11.4656 18.1592 10.737 17.4458 10.737 16.5378C10.737 15.6299 11.4442 14.9165 12.3443 14.9165H33.9039C34.7826 14.9165 35.5112 15.6299 35.5112 16.5378C35.5112 17.4458 34.7826 18.1592 33.9039 18.1592H12.3443ZM12.3443 46.9761C11.4656 46.9761 10.737 46.2411 10.737 45.3547C10.737 44.4684 11.4442 43.7334 12.3443 43.7334H25.2458C26.1244 43.7334 26.8531 44.4684 26.8531 45.3547C26.8531 46.2411 26.1244 46.9761 25.2458 46.9761H12.3443ZM12.3443 32.5784C11.4656 32.5784 10.737 31.8434 10.737 30.9571C10.737 30.0707 11.4442 29.3357 12.3443 29.3357H25.2458C26.1244 29.3357 26.8531 30.0707 26.8531 30.9571C26.8531 31.8434 26.1244 32.5784 25.2458 32.5784H12.3443Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    step: "02",
    bg: "/hiw-2.png",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="96px"
        height="96px"
        viewBox="0 0 24 24"
        id="verified"
        className="icon glyph"
      >
        <path
          d="M21.6,9.84A4.57,4.57,0,0,1,21.18,9,4,4,0,0,1,21,8.07a4.21,4.21,0,0,0-.64-2.16,4.25,4.25,0,0,0-1.87-1.28,4.77,4.77,0,0,1-.85-.43A5.11,5.11,0,0,1,17,3.54a4.2,4.2,0,0,0-1.8-1.4A4.22,4.22,0,0,0,13,2.21a4.24,4.24,0,0,1-1.94,0,4.22,4.22,0,0,0-2.24-.07A4.2,4.2,0,0,0,7,3.54a5.11,5.11,0,0,1-.66.66,4.77,4.77,0,0,1-.85.43A4.25,4.25,0,0,0,3.61,5.91,4.21,4.21,0,0,0,3,8.07,4,4,0,0,1,2.82,9a4.57,4.57,0,0,1-.42.82A4.3,4.3,0,0,0,1.63,12a4.3,4.3,0,0,0,.77,2.16,4,4,0,0,1,.42.82,4.11,4.11,0,0,1,.15.95,4.19,4.19,0,0,0,.64,2.16,4.25,4.25,0,0,0,1.87,1.28,4.77,4.77,0,0,1,.85.43,5.11,5.11,0,0,1,.66.66,4.12,4.12,0,0,0,1.8,1.4,3,3,0,0,0,.87.13A6.66,6.66,0,0,0,11,21.81a4,4,0,0,1,1.94,0,4.33,4.33,0,0,0,2.24.06,4.12,4.12,0,0,0,1.8-1.4,5.11,5.11,0,0,1,.66-.66,4.77,4.77,0,0,1,.85-.43,4.25,4.25,0,0,0,1.87-1.28A4.19,4.19,0,0,0,21,15.94a4.11,4.11,0,0,1,.15-.95,4.57,4.57,0,0,1,.42-.82A4.3,4.3,0,0,0,22.37,12,4.3,4.3,0,0,0,21.6,9.84Zm-4.89.87-5,5a1,1,0,0,1-1.42,0l-3-3a1,1,0,1,1,1.42-1.42L11,13.59l4.29-4.3a1,1,0,0,1,1.42,1.42Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    step: "03",
    bg: "/hiw-3.jpg",
    icon: (
      <svg
        width="69"
        height="69"
        viewBox="0 0 69 69"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M68.9199 35C69.3141 30.7804 68.2102 23.7989 66.5544 19.963C64.9775 16.127 62.612 12.5979 59.6158 9.5291L60.7985 7.76455L61.9812 6L47 6.15344L52.6771 20.3466L53.781 18.7354L54.8849 17.1243C56.6984 19.2725 58.0388 21.6508 58.985 24.1825C59.9312 26.7143 60.5619 31.5476 60.3254 34.3862L64.8198 32.3148L68.9199 35Z"
          fill="white"
        />
        <path
          d="M22.0292 3.28695L20.6539 1.66843L19.2787 0.0499139L15 14L30.1281 13.1522L28.9056 11.6108L27.6831 10.0693C30.2809 9.06737 32.9551 8.52787 35.6292 8.45079C38.3034 8.37372 43.1169 9.29859 45.7146 10.3776L45.027 5.59912L49 2.51623C45.027 0.89771 38.0742 -0.258375 33.9483 0.0499139C29.8225 0.358203 25.773 1.43722 22.0292 3.28695Z"
          fill="white"
        />
        <path
          d="M18 16.6154L13.3277 15.7692L11.6426 11C8.88511 14.2308 5.59149 20.5385 4.59575 24.6154C3.6 28.6923 3.37021 32.8462 3.98298 37L1.99149 37.7692L0 38.5385L11.8723 47L15.7021 32.2308L13.9404 33.0769L12.1021 33.7692C11.9489 31 12.2553 28.3077 13.0213 25.6923C13.8638 23.0769 16.1617 18.7692 18 16.6154Z"
          fill="white"
        />
        <path
          d="M43 60.3077L29.9731 52.0769L30.13 54L30.287 55.9231C27.5404 55.2308 25.0291 54.0769 22.6749 52.5385C20.3991 51 16.9462 47.4615 15.4552 45L13.1009 49.2308L8 49.3846C10.1973 53 15.2982 58.0769 18.9081 60.2308C22.5179 62.4615 26.5202 64 30.7578 64.6923L30.9148 66.8462L31.0718 69L43 60.3077Z"
          fill="white"
        />
        <path
          d="M69 48.7769L64.3866 35L52.8151 44.5906L54.7059 45.0472L56.5966 45.5039C55.1597 47.7874 53.2689 49.8425 51.1513 51.4409C49.0336 53.1155 44.7227 55.1706 42 55.7795L45.2521 59.2047L43.8151 64C47.8992 63.0866 54.1008 59.8898 57.2017 57.2257C60.3025 54.5617 62.9496 51.2887 64.916 47.6352L66.958 48.168L69 48.7769Z"
          fill="white"
        />
      </svg>
    ),
  },
];

const HowItWorks = () => {
  const t = useT();
  const steps = t.raw("home.howItWorks.steps") ?? [];
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
      e.preventDefault();
      if (distance > 0) {
        nextStep();
      } else {
        prevStep();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = steps[currentStep] ?? {};
  const visuals = stepVisuals[currentStep] ?? {};
  const goToTemplate = t("home.howItWorks.goToStep");

  return (
    <section
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.leftPanel}>
        <div className={styles.leftPanelContent}>
          <div>
            <h2 className={styles.title}>
              {t("home.howItWorks.titlePrefix")} <br id="works-break" />
              <span>{t("home.howItWorks.titleSuffix")}</span>
            </h2>
            <p
              className={styles.description}
              dangerouslySetInnerHTML={{
                __html: current.description ?? "",
              }}
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
                aria-label={goToTemplate.replace("{n}", String(index + 1))}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.rightPanelWrapper} onClick={() => nextStep()}>
        <img
          src={visuals.bg}
          alt={current.panelTitle ?? ""}
          className={styles.rightPanelImage}
        />
        <div className={styles.rightPanel}>
          <span className={styles.stepLabel}>{visuals.step}</span>
          <div className={styles.contentContainer}>
            <div className={styles.iconContainer}>{visuals.icon}</div>
            <h3 className={styles.panelTitle}>{current.panelTitle}</h3>
            <p className={styles.panelDescription}>{current.panelDescription}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
