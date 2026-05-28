import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import GradientButton from "@components/Button/GradientButton";
import { useT } from "@/i18n/LocaleContext";

import useIsMobile from "@/hooks/useIsMobile";

import styles from "./Governance.module.scss";

const Governance = () => {
  const t = useT();
  const governanceItems = t.raw("token.governance.items") ?? [];
  const { isMobile } = useIsMobile(1280);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      setIsDragging(true);
      setDragOffset(e.deltaX);
    },
    onSwipedLeft: () => {
      setIsDragging(false);
      setDragOffset(0);
      setCurrentIndex((prev) => (prev === governanceItems.length - 1 ? 0 : prev + 1));
    },
    onSwipedRight: () => {
      setIsDragging(false);
      setDragOffset(0);
      setCurrentIndex((prev) => (prev === 0 ? governanceItems.length - 1 : prev - 1));
    },
    onSwiped: () => {
      setIsDragging(false);
      setDragOffset(0);
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <section className={styles.governance}>
      <ScrollReveal>
        <h1>
          <i>{t("token.governance.title")}</i>
        </h1>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <p>{t("token.governance.lead")}</p>
      </ScrollReveal>

        {!isMobile ? (
          <ScrollReveal delay={0.25}>
            <div className={styles.governanceImgContainer}>
              <p
                className={styles.governanceTextOne}
                dangerouslySetInnerHTML={{ __html: governanceItems[0] ?? "" }}
              />
              <p
                className={styles.governanceTextTwo}
                dangerouslySetInnerHTML={{ __html: governanceItems[1] ?? "" }}
              />
              <p
                className={styles.governanceTextThree}
                dangerouslySetInnerHTML={{ __html: governanceItems[2] ?? "" }}
              />
              <img src="/token/governance.png" className={styles.governanceImg} />
            </div>
          </ScrollReveal>
        ) : (
          <div {...handlers} className={styles.governanceMobileSliderContainer}>
            <div className={styles.sliderWrapper}>
              <div
                className={styles.sliderTrack}
                style={{
                  transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
                  transition: isDragging ? "none" : "transform 0.3s ease-out",
                }}
              >
                {governanceItems.map((item, index) => (
                  <div key={index} className={styles.sliderSlide}>
                    <p
                      className={styles.governanceText}
                      dangerouslySetInnerHTML={{ __html: item }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <img src="/token/governance_mobile.png" className={styles.mobileGovernanceImg} />
            <div className={styles.dotsContainer}>
              {governanceItems.map((_, index) => (
                <div
                  key={index}
                  className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ""}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </div>
        )}

      <ScrollReveal delay={0.35}>
        <p dangerouslySetInnerHTML={{ __html: t("token.governance.closing") }} />
      </ScrollReveal>

      <ScrollReveal delay={0.45}>
        <GradientButton
          href="https://dashboard.origyn.com/governance"
          text={t("token.governance.cta")}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaButton}
        />
      </ScrollReveal>
    </section>
  )
}

export default Governance;
