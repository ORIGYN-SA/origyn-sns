import { useState, useRef, useEffect } from "react";
import styles from "./UseCases.module.css";
import UseCaseCard from "./UseCaseCard";

const useCases = [
  {
    title: "Art",
    description:
      "Authenticate and protect the provenance of physical and digital artworks on-chain.",
    image: "/uc-1.png",
    position: "top",
    height: "550px",
    link: "/use-case/art",
  },
  {
    title: "Gold",
    description:
      "Certify gold with immutable, traceable, and tamper-proof digital certificates.",
    image: "/uc-2.jpg",
    position: "bottom",
    link: "/use-case/gold",
  },
  {
    title: "Diamonds",
    description:
      "Track origin, grading, and ownership of each diamond with blockchain precision.",
    image: "/uc-3-c.jpg",
    position: "top",
    height: "570px",
    link: "/use-case/luxury",
  },
  {
    title: "Made In",
    description:
      "Prove the origin, authenticity, and craftsmanship of any product, from watches to fashion.",
    image: "/uc-4.jpg",
    position: "top",
    link: "/use-case/madein",
  },
];

const UseCases = ({ id }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const storedScrollPosition = localStorage.getItem("scrollPosition");
    if (storedScrollPosition === "use-cases") {
      const element = document.getElementById("use-cases");
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
      localStorage.removeItem("scrollPosition");
    }
  }, []);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    if (!isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!isMobile || !touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < useCases.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

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

      <div
        className={styles.grid}
        ref={gridRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={isMobile ? { "--current-index": currentIndex } : undefined}
      >
        {useCases.map((useCase, index) => (
          <UseCaseCard
            key={index}
            {...useCase}
            className={
              isMobile && index === currentIndex ? styles.activeCard : ""
            }
          />
        ))}
      </div>

      {isMobile && (
        <div className={styles.indicators}>
          {useCases.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${
                index === currentIndex ? styles.active : ""
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to use case ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default UseCases;
