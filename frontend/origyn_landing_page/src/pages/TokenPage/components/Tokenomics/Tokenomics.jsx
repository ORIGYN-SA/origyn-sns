import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { OGYCirculationState, OrigynFoundationReserve } from "./components/Chart";
import GradientButton from "@components/Button/GradientButton";
import styles from "./Tokenomics.module.scss";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import useFoundationReserve from "@/hooks/useFoundationReserve";

const slides = [<OGYCirculationState />, <OrigynFoundationReserve />];

const Tokenomics = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { data } = useFoundationReserve();

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
        <h1>
          <ScrollReveal delay={0.15}>
            Tokenomics Overview
          </ScrollReveal>
        </h1>

        <ScrollReveal delay={0.25}>
          <p>
            <b>Total Supply:</b> {data?.string.totalSupply} OGY
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.35}>
          <p>
            <b>Distribution:</b> Allocated to ecosystem growth, staking rewards, community, and governance.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.35}>
          <p>
           <b>Revenue Model:</b> Protocol fees paid in OGY create ongoing demand while reducing supply through burning mechanisms.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.45}>
          <p className={styles.tokenomicsSupport}>
           <b>
              The model is designed to support long-term protocol sustainability and token holder alignment.
            </b>
          </p>
        </ScrollReveal>
         <ScrollReveal delay={0.45}>
            <GradientButton
              href="https://dashboard.origyn.com/Tokenomics_V3.pdf"
              text="TOKENOMIC"
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
            {slides.map((slide, index) => (
              <div key={index} className={styles.sliderSlide}>
                {slide}
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
