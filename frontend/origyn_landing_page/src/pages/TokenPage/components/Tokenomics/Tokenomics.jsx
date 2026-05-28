import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import {
  OGYCirculationState,
  OrigynFoundationReserve,
  TotalOGYBurned,
  TotalOGYSupply,
} from "./components/Chart";
import GradientButton from "@components/Button/GradientButton";
import styles from "./Tokenomics.module.scss";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import useTotalOGYSupply from "@/hooks/useTotalOGYSupply";
import { useT } from "@/i18n/LocaleContext";

const slides = [
  OGYCirculationState,
  OrigynFoundationReserve,
  TotalOGYSupply,
  TotalOGYBurned,
];

const Tokenomics = () => {
  const t = useT();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { data } = useTotalOGYSupply();

  const handlers = useSwipeable({
    onSwiping: (e) => {
      setIsDragging(true);
      setDragOffset(e.deltaX);
    },
    onSwipedLeft: () => {
      setIsDragging(false);
      setDragOffset(0);
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    },
    onSwipedRight: () => {
      setIsDragging(false);
      setDragOffset(0);
      setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    },
    onSwiped: () => {
      setIsDragging(false);
      setDragOffset(0);
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  return (
    <section className={styles.tokenomics}>
      <div className={styles.tokenomicsContent}>
        <ScrollReveal>
          <h1>
            {t("token.tokenomics.titleLineOne")}
            <br />
            <i>{t("token.tokenomics.titleEmphasis")}</i>
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={0.25}>
          <p>
            <b>{t("token.tokenomics.totalSupplyLabel")}</b>{" "}
            {data?.totalSupplyOGYToString ?? "..."} {t("token.tokenomics.totalSupplyUnit")}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.35}>
          <p dangerouslySetInnerHTML={{ __html: t("token.tokenomics.distribution") }} />
        </ScrollReveal>

        <ScrollReveal delay={0.35}>
          <p dangerouslySetInnerHTML={{ __html: t("token.tokenomics.revenue") }} />
        </ScrollReveal>

        <ScrollReveal delay={0.45}>
          <p className={styles.tokenomicsSupport}>
            <b>{t("token.tokenomics.support")}</b>
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.45}>
          <GradientButton
            href="https://dashboard.origyn.com/Tokenomics_V3.pdf"
            text={t("token.tokenomics.cta")}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.tokenomicsButton}
          />
        </ScrollReveal>
      </div>
      <div className={styles.tokenomicsChart}>
        <div {...handlers} className={styles.sliderWrapper}>
          <div
            className={styles.sliderTrack}
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
              transition: isDragging ? "none" : "transform 0.3s ease-out",
            }}
          >
            {slides.map((SlideComponent) => (
              <div key={SlideComponent.name} className={styles.sliderSlide}>
                <SlideComponent />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.dotsContainer}>
          {slides.map((_, index) => (
            <div
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ""}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Tokenomics;
