import React, { useEffect, useRef, useState } from "react";
import styles from "./OurRoadmap.module.css";
import RoadmapCard from "./RoadmapCard";

const roadmapCards = [
  {
    title: "ORIGYN Foundation Funded",
    description:
      "The ORIGYN Foundation was established in Neuchâtel, Switzerland to begin development of the ORIGYN Protocol.",
    when: "Q3 2020",
    year: 2020,
    image: "/roadmap-1.png",
    link: "https://fr.wikipedia.org/wiki/Origyn_Foundation",
  },
  {
    title: "OGY Token Launch",
    description:
      "The native utility token $OGY is created to power protocol fees, governance, and staking.",
    when: "Q3 2021",
    year: 2021,
    image: "/roadmap-ogy-launch.jpg",
    link: "https://origyn.medium.com/ogy-reserve-price-round-pre-registration-opening-soon-391187da3d7f",
  },
  {
    title: "ORIGYN NFT Standard v1.0",
    description:
      "Launch of the first version of ORIGYN's NFT standard enabling on-chain certification.",
    when: "Q3 2022",
    year: 2022,
    image: "/ogy-background-mobile.jpg",
    link: "https://origyn.medium.com/intro-to-the-origyn-nft-cd96e7f9e9c1",
  },
  {
    title: "Tokenomics 2.0 Update",
    description:
      "200 million $OGY tokens previously allocated to the Foundation are burned, initiating deflationary pressure.",
    when: "Q4 2022",
    year: 2022,
    image: "/roadmap-tokenmoics.jpg",
    link: "https://origyn.medium.com/origyn-announces-important-updates-to-ogy-governance-d2133f88e077",
  },
  {
    title: "Minting Platform 1.0",
    description:
      "Launch of the first on-chain minting interface for digital certificates.",
    when: "Q1 2023",
    year: 2023,
    image: "/roadmap-floating.png",
    link: "https://origyn.medium.com/the-origyn-digital-certificate-9b33f9766c78",
  },
  {
    title: "Strategic Partnerships",
    description:
      "Strategic collaborations with FederItaly and METALOR to certify Italian-made products and tokenized gold.",
    when: "Q1 2023",
    year: 2023,
    image: "/roadmap-3.png",
    link: "https://origyn.medium.com/tradition-meets-innovation-a-digital-certificate-for-authentic-italian-products-7f61c98e5687",
  },
  {
    title: "First Gold Purchase",
    description:
      "3 kg of physical gold bought and tokenized using the ORIGYN Protocol.",
    when: "Q2 2023",
    year: 2023,
    image: "/roadmap-first-gold.png",
    link: "https://origyn.medium.com/origyn-technology-empowers-creation-of-digital-certificates-for-metalor-gold-bars-be092befb3e5",
  },
  {
    title: "Acquisition of CanDB",
    description:
      "ORIGYN acquires CanDB, a decentralized, scalable database solution optimized for NFT metadata.",
    when: "Q2 2023",
    year: 2023,
    image: "/roadmap-candb.jpg",
    link: "https://origyn.medium.com/origyn-foundation-acquires-candb-paves-the-way-for-new-decentralized-businesses-7a4a0481694f",
  },
  {
    title: "Tokenomics 3.0 and Dashboard Launch",
    description:
      "A deflationary model is introduced with Tokenomics 3.0 and the first version of the ORIGYN Dashboard is released.",
    when: "Q3 2023",
    year: 2023,
    image: "/roadmap-tokenomics-3.jpg",
    link: "https://dashboard.origyn.com/",
  },
  {
    title: "10,000 Protocol Users",
    description: "ORIGYN surpasses 10,000 unique protocol users.",
    when: "Q4 2023",
    year: 2023,
    image: "/roadmap-4.png",
    link: "https://origyn.medium.com/origyns-2024-year-in-review-milestones-and-achievements-09c629d5797c",
  },
  {
    title: "Launch of Gold DAO",
    description:
      "Gold DAO becomes the first DAO built on ORIGYN to tokenize and certify physical gold on-chain.",
    when: "Q4 2023",
    year: 2023,
    image: "/roadmap-golddao.png",
    link: "https://origyn.medium.com/case-study-how-origyn-powers-gold-daos-decentralized-gold-asset-management-with-gld-nfts-5a87f21af247",
  },
  {
    title: "500M OGY Donation to Gold DAO",
    description:
      "Half a billion $OGY tokens are donated to support Gold DAO's long-term treasury.",
    when: "Q1 2024",
    year: 2024,
    image: "/roadmap-500m.png",
    link: "https://dashboard.origyn.com/explorer/transactions/accounts/54vkq-taaaa-aaaap-ahqra-cai",
  },
  {
    title: "ORIGYN DAO Integrated with ICP SNS",
    description:
      "The ORIGYN DAO becomes fully decentralized and governed on the Internet Computer's SNS framework.",
    when: "Q2 2024",
    year: 2024,
    image: "/roadmap-sns.jpg",
    link: "https://origyn.medium.com/migrating-to-the-sns-ogy-token-and-the-new-governance-framework-cd6311e8334e",
  },
  {
    title: "Dashboard V2 Release",
    description:
      "New version of the dashboard includes live metrics, staking stats, and governance tools.",
    when: "Q2 2024",
    year: 2024,
    image: "/integrator-program.jpg",
    link: "https://dashboard.origyn.com/",
  },
  {
    title: "30,000 Users Milestone",
    description:
      "ORIGYN grows to over 30,000 users, a 300% increase in six months.",
    when: "Q3 2024",
    year: 2024,
    image: "/roadmap-30k.jpg",
    link: "https://origyn.medium.com/origyns-2024-year-in-review-milestones-and-achievements-09c629d5797c",
  },
  {
    title: "Collaboration with Leo Caillard and Gil Sertissage",
    description:
      "ORIGYN certifies physical artworks and diamonds in high-profile partnerships.",
    when: "Q3 2024",
    year: 2024,
    image: "/roadmap-leo-gil.jpg",
    link: "https://origyn.medium.com/preserving-leo-caillards-timeless-marble-art-with-origyn-36c904a99a7a",
  },
  {
    title: "ORIGYN NFT Standard v2.0",
    description:
      "NFT standard is upgraded to enable secure certificate transferability.",
    when: "Q3 2024",
    year: 2024,
    image: "/roadmap-standard-v2.jpg",
    link: "https://origyn.medium.com/origyn-nft-standard-2-0-transferability-395d22d02b0b",
  },
  {
    title: "Integrator Framework Launched",
    description:
      "Rules and onboarding structure created to guide new partners integrating with ORIGYN.",
    when: "Q4 2024",
    year: 2024,
    image: "/roadmap-integrator.jpg",
    link: "https://origyn.medium.com/origyn-foundation-unveils-strategy-to-service-increasing-industry-demand-via-the-introduction-of-60b2498508da",
  },
  {
    title: "Launch of Cecil DAO",
    description:
      "ORIGYN supports the launch of Cecil DAO to fund conservation and humanitarian projects using blockchain transparency.",
    when: "Q1 2025",
    year: 2025,
    image: "/roadmap-6.jpg",
    link: "https://cecil-dao.gitbook.io/cecil-dao/cecil-dao",
  },
  {
    title: "Acquisition of ClaimLink ",
    description:
      "ORIGYN acquires ClaimLink, a decentralized NFT and token distribution platform built on ICP.",
    when: "Q1 2025",
    year: 2025,
    image: "/roadmap-claimlink.png",
    link: "https://origyn.medium.com/origyn-acquires-claimlink-ushering-in-a-new-era-of-frictionless-digital-asset-distribution-00e3a741f22e",
  },
  {
    title: "ICRC–7 NFT Standard",
    description:
      "A new standard is introduced to increase certificate interoperability and ecosystem-wide utility.",
    when: "Q2 2025",
    year: 2025,
    image: "/roadmap-7.png",
    link: "https://origyn.medium.com/a-new-chapter-for-nfts-on-icp-origyn-launches-icrc7-icrc37-986a009ee641",
  },

  {
    title: "New Minting Studio for Integrators and Institutions",
    when: "Q1 2026",
    year: 2026,
    description:
      "A self-service tool is launched allowing anyone to mint on-chain, certificates of RWA on  ORIGYN infrastructure.",
    image: "/roadmap-int.png",
  },
  {
    title: "Runestone",
    when: "Q2 2026",
    year: 2026,
    description: "The Runestone mystery will be revealed Q2 2026 in Geneva.",
    image: "/roadmap-9.png",
  },
  {
    title: "Minting Lab",
    description:
      "A self-service tool is launched allowing anyone to mint on-chain, using ORIGYN infrastructure.",
    when: "Q2 2026",
    year: 2025,
    image: "/roadmap-8.png",
  },
  {
    title: "IP Protection Implementation",
    description:
      "Support for on-chain certification of intellectual property rights is integrated into the protocol.",
    when: "Q3 2026",
    year: 2026,
    image: "/roadmap-10.png",
  },
  {
    title: "Cross–Chain Implementation",
    description:
      "Cross-chain compatibility expands ORIGYN's reach to other major ecosystems.",
    when: "Q3 2026",
    year: 2026,
    image: "/roadmap-chain.jpg",
  },
  {
    title: "Global Wallet and Marketplace Integration",
    description:
      "ORIGYN NFTs become accessible through leading wallets and NFT marketplaces worldwide.",
    when: "Q4 2026",
    year: 2026,
    image: "/roadmap-wallet-int.jpg",
  },
  {
    title: "Becoming the Universal Certification Standard",
    description:
      "ORIGYN aims to establish itself as the global benchmark for digital certification across all asset classes.",
    when: "Q1 2027",
    year: 2027,
    image: "/roadmap-last.png",
  },
];

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
