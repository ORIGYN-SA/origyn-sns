import React, { useEffect, useRef, useState } from "react";
import styles from "./OurRoadmap.module.css";
import RoadmapCard from "./RoadmapCard";

const roadmapCards = [
  {
    title: "ORIGYN Foundation",
    description:
      "First contributor of the ORIGYN Protocol - is funded in Neuchatel, Switzerland with the aim to launch the protocol",
    when: "Q3 2020",
    year: 2020,
    image: "/roadmap-1.png",
  },
  {
    title: "Creation of the ORIGYN NFT Standard v1.0",
    description: "First Certificates Minted",
    when: "Q3 2022 SEPTEMBER",
    year: 2022,
    image: "/roadmap-2.png",
  },
  {
    title: "Strategic Partnerships with Feder Italy and METALOR",
    when: "Q3 2023 MARCH",
    year: 2023,
    image: "/roadmap-3.png",
  },
  {
    title: "Reached 10,000 OGY protocol users.",
    when: "Q4 2023",
    year: 2023,
    image: "/roadmap-4.png",
  },
  {
    title: "ORIGYN Dashboard V2",
    description:
      "A new certificate standard designed to improve NFT interoperability, traceability, and utility across the ORIGYN ecosystem.",
    when: "Q2 2024 JUNE",
    year: 2024,
    image: "/integrator-program.png",
  },
  {
    title: "Support of the launch of Cecil DAO",
    description:
      "Advancing decentralized funding for conservation and humanitarian initiatives through blockchain technology.",
    when: "Q1 2025",
    year: 2025,
    image: "/roadmap-6.jpg",
  },
  {
    title: "New ICRC7 NFT Standard",
    description:
      "A new certificate standard designed to improve NFT interoperability, traceability, and utility across the ORIGYN ecosystem.",
    when: "Q2 2025",
    year: 2025,
    image: "/roadmap-7.png",
  },
  {
    title: "Launch of a Public Minting Studio",
    description:
      "A self-service platform allowing anyone to mint certified, on-chain digital assets using ORIGYN's infrastructure.",
    when: "Q4 2025",
    year: 2025,
    image: "/roadmap-8.png",
  },
  {
    title: "Runestone",
    when: "Q1 2026",
    year: 2026,
    description:
      "Redefining luxury living, with a focus on blending safety and style.",
    image: "/roadmap-9.png",
  },
  {
    title: "Implementation Intellectual Property Protection",
    when: "Q2 2026",
    year: 2026,
    image: "/roadmap-10.png",
  },
];

const yearRange = [2020, 2022, 2023, 2024, 2025, 2026];

const DesktopCards = () => {
  const roadmapWrapperRef = useRef(null);
  const primaryCardRef = useRef(null);
  const [currentYear, setCurrentYear] = useState(yearRange[4]);
  const yearRefs = useRef({});
  const firstCardIndexByYear = {};
  roadmapCards.forEach((card, idx) => {
    if (card.year && firstCardIndexByYear[card.year] === undefined) {
      firstCardIndexByYear[card.year] = idx;
      if (!yearRefs.current[card.year]) {
        yearRefs.current[card.year] = React.createRef();
      }
    }
  });
  useEffect(() => {
    const wrapper = roadmapWrapperRef.current;
    if (!wrapper) return;
    const handleScroll = () => {
      const wrapperRect = wrapper.getBoundingClientRect();
      const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
      let minDist = Infinity;
      let foundYear = currentYear;

      if (wrapper.scrollLeft === 0) {
        foundYear = 2020;
      } else {
        roadmapCards.forEach((card, idx) => {
          let ref = null;
          if (firstCardIndexByYear[card.year] === idx) {
            ref = yearRefs.current[card.year];
          }
          if (ref && ref.current) {
            const cardRect = ref.current.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const dist = Math.abs(cardCenter - wrapperCenter);
            if (dist < minDist) {
              minDist = dist;
              foundYear = card.year;
            }
          }
        });
      }
      setCurrentYear(foundYear);
    };
    wrapper.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => wrapper.removeEventListener("scroll", handleScroll);
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
      <div className={styles.roadmapCardsWrapper} ref={roadmapWrapperRef}>
        <div className={styles.roadmapTimeline}></div>
        {roadmapCards.map((card, idx) => {
          const ref =
            firstCardIndexByYear[card.year] === idx
              ? yearRefs.current[card.year]
              : null;
          return <RoadmapCard key={idx} {...card} ref={ref} />;
        })}
      </div>
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
              if (ref && ref.current) {
                const wrapper = roadmapWrapperRef.current;
                const card = ref.current;
                const cardRect = card.getBoundingClientRect();
                const wrapperRect = wrapper.getBoundingClientRect();
                const cardOffset = cardRect.left - wrapperRect.left;
                let scrollPosition =
                  cardOffset - wrapperRect.width / 2 + cardRect.width / 2;

                if (year === 2026) {
                  scrollPosition += 40;
                }

                wrapper.scrollTo({
                  left: scrollPosition,
                  behavior: "smooth",
                });
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
  const [currentYear, setCurrentYear] = useState(yearRange[4]);

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
      <div style={{ width: "100%" }}>
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
        <h2 className={styles.title}>Roadmap</h2>
        <p className={styles.description}>
          From new utilities and governance features to expanded support for
          industries and developers. Every milestone reflects our mission to
          bring real-world assets fully on-chain through scalable, verifiable,
          and decentralized infrastructure.
        </p>
      </div>
      {isDesktop ? <DesktopCards /> : <MobileCards />}
    </section>
  );
};

export default OurRoadmap;
