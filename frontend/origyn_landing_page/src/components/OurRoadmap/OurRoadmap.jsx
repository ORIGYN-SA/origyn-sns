import React, { useEffect, useRef, useState } from "react";
import styles from "./OurRoadmap.module.scss";
import RoadmapCard from "./RoadmapCard";
import roadmapCards from "./roadmapData.json";
import { useT } from "@/i18n/LocaleContext";

const yearRange = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];

const DesktopCards = () => {
  const roadmapWrapperRef = useRef(null);
  const primaryCardRef = useRef(null);
  const [currentYear, setCurrentYear] = useState(2025);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);
  const yearRefs = useRef({});
  const firstCardIndexByYear = {};

  // Build index of first cards by year
  roadmapCards.forEach((card, idx) => {
    if (card.year && firstCardIndexByYear[card.year] === undefined) {
      firstCardIndexByYear[card.year] = idx;
      if (!yearRefs.current[card.year]) {
        yearRefs.current[card.year] = React.createRef();
      }
    }
  });

  // Add initial scroll to 2025
  useEffect(() => {
    const wrapper = roadmapWrapperRef.current;
    const ref = yearRefs.current[2026];

    if (wrapper && ref && ref.current) {
      const card = ref.current;
      const wrapperRect = wrapper.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();

      // Calculate scroll position to center the card
      const scrollLeft =
        wrapper.scrollLeft +
        (cardRect.left - wrapperRect.left) -
        (wrapperRect.width - cardRect.width) / 2;

      // Add a small delay to ensure all elements are properly rendered
      setTimeout(() => {
        wrapper.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }, 100);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Simplified scroll position detection for fade effects
  useEffect(() => {
    const wrapper = roadmapWrapperRef.current;
    if (!wrapper) return;

    const checkScroll = () => {
      const isAtStart = wrapper.scrollLeft <= 0;
      const isAtEnd =
        wrapper.scrollLeft >= wrapper.scrollWidth - wrapper.clientWidth - 1;

      setShowLeftFade(!isAtStart);
      setShowRightFade(!isAtEnd);
    };

    wrapper.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    checkScroll();

    return () => {
      wrapper.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  useEffect(() => {
    const wrapper = roadmapWrapperRef.current;
    if (!wrapper) return;
    const handleScroll = () => {
      const wrapperRect = wrapper.getBoundingClientRect();
      const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;

      // If at start, select first year
      if (wrapper.scrollLeft <= 10) {
        setCurrentYear(yearRange[0]);
        return;
      }

      // If at end, select last year
      if (
        wrapper.scrollLeft >=
        wrapper.scrollWidth - wrapper.clientWidth - 10
      ) {
        setCurrentYear(yearRange[yearRange.length - 1]);
        return;
      }

      // Find closest year based on card positions
      let closestYear = currentYear;
      let minDistance = Infinity;

      Object.entries(yearRefs.current).forEach(([year, ref]) => {
        if (ref.current) {
          const cardRect = ref.current.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const distance = Math.abs(cardCenter - wrapperCenter);

          if (distance < minDistance) {
            minDistance = distance;
            closestYear = parseInt(year);
          }
        }
      });

      if (closestYear !== currentYear) {
        setCurrentYear(closestYear);
      }
    };

    // Debounce scroll handler for better performance
    let scrollTimeout;
    const debouncedHandleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 50);
    };

    wrapper.addEventListener("scroll", debouncedHandleScroll);
    handleScroll(); // Initial check

    return () => {
      wrapper.removeEventListener("scroll", debouncedHandleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentYear]);

  useEffect(() => {
    const wrapper = roadmapWrapperRef.current;

    if (!wrapper) return;
    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        wrapper.scrollLeft += e.deltaY;
      }
    };
    wrapper.addEventListener("wheel", handleWheel, { passive: false });

    if (!primaryCardRef.current || !wrapper) return;
    const images = primaryCardRef.current.getElementsByTagName("img");
    let loadedImages = 0;
    const totalImages = images.length;
    const scrollToPrimary = () => {
      const card = primaryCardRef.current;
      const cardRect = card.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      const cardOffset = cardRect.left - wrapperRect.left;
      const scrollPosition =
        cardOffset - wrapperRect.width / 2 + cardRect.width / 2;
      wrapper.scrollLeft = scrollPosition;
    };
    if (totalImages === 0) {
      setTimeout(scrollToPrimary, 100);
      return;
    }
    Array.from(images).forEach((img) => {
      if (img.complete) {
        loadedImages++;
        if (loadedImages === totalImages) {
          setTimeout(scrollToPrimary, 100);
        }
      } else {
        img.onload = () => {
          loadedImages++;
          if (loadedImages === totalImages) {
            setTimeout(scrollToPrimary, 100);
          }
        };
      }
    });

    return () => wrapper.removeEventListener("wheel", handleWheel);
  }, []);
  return (
    <>
      <div className={styles.roadmapContainer}>
        <div className={styles.roadmapCardsWrapper} ref={roadmapWrapperRef}>
          <div className={styles.roadmapTimeline}></div>
          {roadmapCards.map((card, idx) => {
            const ref =
              firstCardIndexByYear[card.year] === idx
                ? yearRefs.current[card.year]
                : null;
            return card.link ? (
              <a
                href={card.link}
                key={idx}
                target="_blank"
                rel="noopener noreferrer"
              >
                <RoadmapCard {...card} ref={ref} />
              </a>
            ) : (
              <RoadmapCard key={idx} {...card} ref={ref} />
            );
          })}
        </div>
        <div
          className={`${styles.fadeLeft} ${showLeftFade ? styles.visible : ""}`}
        />
        <div
          className={`${styles.fadeRight} ${showRightFade ? styles.visible : ""}`}
        />
      </div>
      <div className={styles.sliderContainer}></div>
      <div className={styles.yearIndicators}>
        {yearRange.map((year) => (
          <button
            key={year}
            className={
              styles.yearIndicatorBtn +
              (year === currentYear
                ? " " + styles.yearIndicatorBtnSelected
                : "")
            }
            onClick={() => {
              const ref = yearRefs.current[year];
              if (ref && ref.current && roadmapWrapperRef.current) {
                const wrapper = roadmapWrapperRef.current;
                const card = ref.current;
                const wrapperRect = wrapper.getBoundingClientRect();
                const cardRect = card.getBoundingClientRect();

                const scrollLeft =
                  wrapper.scrollLeft +
                  (cardRect.left - wrapperRect.left) -
                  (wrapperRect.width - cardRect.width) / 2;

                wrapper.scrollTo({
                  left: scrollLeft,
                  behavior: "smooth",
                });

                setTimeout(() => document.activeElement.blur(), 1000);
              }
            }}
          >
            {year}
          </button>
        ))}
      </div>
    </>
  );
};

const MobileCards = () => {
  const roadmapWrapperRef = useRef(null);
  const yearIndicatorsRef = useRef(null);
  const [currentYear, setCurrentYear] = useState(2025);

  // useEffect(() => {
  //   if (yearIndicatorsRef.current && window.innerWidth <= 1200) {
  //     const selectedButton = yearIndicatorsRef.current.querySelector(
  //       `.${styles.yearIndicatorBtnSelected}`
  //     );
  //     if (selectedButton) {
  //       selectedButton.scrollIntoView({
  //         behavior: "smooth",
  //         block: "nearest",
  //         inline: "center",
  //       });
  //     }
  //   }
  // }, [currentYear]);

  const currentIndex = yearRange.indexOf(currentYear);
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentYear(yearRange[currentIndex - 1]);
      yearIndicatorsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  const handleNext = () => {
    if (currentIndex < yearRange.length - 1) {
      setCurrentYear(yearRange[currentIndex + 1]);
      yearIndicatorsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <>
      <div style={{ width: "100%", overflow: "hidden" }}>
        <div className={styles.yearIndicators} ref={yearIndicatorsRef}>
          {yearRange.map((year) => (
            <button
              key={year}
              className={
                styles.yearIndicatorBtn +
                (year === currentYear
                  ? " " + styles.yearIndicatorBtnSelected
                  : "")
              }
              onClick={() => {
                setCurrentYear(year);
              }}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.roadmapCardsWrapper} ref={roadmapWrapperRef}>
        <div className={styles.roadmapTimeline}></div>
        {roadmapCards
          .filter((card) => card.year === currentYear)
          .map((card, idx) => {
            return <RoadmapCard key={idx} {...card} />;
          })}
      </div>
      <div className={styles.buttonsNavigator}>
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={styles.yearNavBtn + " " + styles.left}
        >
          {currentIndex > 0 ? (
            <>
              <img
                style={{ marginTop: "2px" }}
                width={12}
                height={12}
                src="/chevron-left.svg"
                alt="chevron-left"
              />
              {yearRange[currentIndex - 1]}
            </>
          ) : (
            ""
          )}
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === yearRange.length - 1}
          className={styles.yearNavBtn + " " + styles.right}
        >
          {currentIndex < yearRange.length - 1 ? (
            <>
              {yearRange[currentIndex + 1]}
              <img
                style={{ marginTop: "2px" }}
                width={12}
                height={12}
                src="/chevron-right.svg"
                alt="chevron-right"
              />
            </>
          ) : (
            ""
          )}
        </button>
      </div>
    </>
  );
};

const OurRoadmap = () => {
  const t = useT();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth > 1200);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t("home.roadmap.title")}</h2>
        <p className={styles.description}>{t("home.roadmap.description")}</p>
      </div>
      {isDesktop ? <DesktopCards /> : <MobileCards />}
    </section>
  );
};

export default OurRoadmap;
