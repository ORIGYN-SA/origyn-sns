import { useEffect, useRef, useState } from "react";
import styles from "./OurRoadmap.module.css";
import RoadmapCard from "./RoadmapCard";

const roadmapCards = [
  {
    title: "Tokenomics 1.0",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q3 2020",
    image: "/roadmap-q1.png",
  },
  {
    title: "First Contributor!",
    description:
      "ORIGYN Foundation - first contributor of the ORIGYN Protocol - is funded in Neuchatel, Switzerland with the aim to launch the protocol",
    when: "Q3 2020",
    image: "/roadmap-q1.png",
  },
  {
    title: "Token Generation Event",
    description: "16 November 2021 OGY Token created",
    when: "Q3 2021",
    image: "/roadmap-q1.png",
  },
  {
    title: "ORIGYN Protocol Launch",
    description:
      "Creation of the ORIGYN NFT Standard v1.0. First Certificates Minted",
    when: "Q3 2022",
    image: "/roadmap-q1.png",
  },
  {
    title: "Tokenomics 2.0",
    description:
      "Stop generating vesting rewards and burned 200 Million of rewards generated for ORIGYN Foundation",
    when: "Q3 2022",
    image: "/roadmap-q1.png",
  },
  {
    title: "Minting Platform 1.0",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q1 2023",
    image: "/roadmap-q1.png",
  },
  {
    title: "Partnerships with FederItaly and Metalor",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q1 2023",
    image: "/roadmap-q2.png",
  },
  {
    title: " Acquisition of CanDB",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q2 2022",
    image: "/roadmap-q2.png",
  },
  {
    title: "Tokenomics 3.0 & OGY Dashboard",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q3 2022",
    image: "/roadmap-q4.png",
  },
  {
    title: "Reached 10 000 OGY protocol users!",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q4 2022",
    image: "/roadmap-q4.png",
  },
  {
    title: "The Gold DAO",
    description: "First DAO to use ORIGYN Protocol",
    when: "Q4 2022",
    image: "/roadmap-q4.png",
  },
  {
    title: "OGY SNS & Dashboard V2",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q2 2024",
    image: "/roadmap-q4.png",
  },
  {
    title: "300% growth in 6 months!",
    description:
      "Reached 30 000 protocl users. Collaboration with Leo Caillard and Gil.",
    when: "Q3 2024",
    image: "/roadmap-q4.png",
  },
  {
    title: "ORIGYN NFT Standard v2.0",
    description: "Integrating transferability of the ORIGYN NFT Certificate",
    when: "Q3 2024",
    image: "/roadmap-q4.png",
  },
  {
    title: "Integrators",
    description: "Onboarding process and rules of engagement",
    when: "Q4 2024",
    image: "/roadmap-q4.png",
  },
  // scroll here
  {
    title: "Support of the launch of Cecil DAO",
    description:
      "Advancing decentralized funding for conservation and humanitarian initiatives through blockchain technology.",
    when: "Q1 2025",
    image: "/roadmap-q1.png",
    isPrimary: true,
  },
  {
    title: "New ICRC7 NFT Standard",
    description:
      "A new certificate standard designed to improve NFT interoperability, traceability, and utility across the ORIGYN ecosystem.",
    when: "Q2 2025",
    image: "/roadmap-q2.png",
  },
  {
    title: "Public Minting Studio",
    description:
      "A self-service platform allowing anyone to mint certified, on-chain digital assets using ORIGYN's infrastructure.",
    when: "Q4 2025",
    image: "/roadmap-q4.png",
  },
  {
    title: "Runestone",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q1 2026",
    image: "/roadmap-q4.png",
  },
  {
    title: "Intellectual Property Protection",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q2 2026",
    image: "/roadmap-q4.png",
  },
  {
    title: "Cross Chain implementation",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q3 2026",
    image: "/roadmap-q4.png",
  },
  {
    title: "ORIGYN NFT on multiple global wallets and marketplaces",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "Q3 2026",
    image: "/roadmap-q4.png",
  },
  {
    title: "Becoming a Universal Certification Standard",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    when: "2027 - 2028",
    image: "/roadmap-q4.png",
  },
];

const OurRoadmap = () => {
  const roadmapWrapperRef = useRef(null);
  const primaryCardRef = useRef(null);
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

  useEffect(() => {
    const wrapper = roadmapWrapperRef.current;
    if (!wrapper || !isDesktop) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        wrapper.scrollLeft += e.deltaY;
      }
    };

    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", handleWheel);
  }, [isDesktop]);

  useEffect(() => {
    const wrapper = roadmapWrapperRef.current;
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
      <div className={styles.roadmapCardsWrapper} ref={roadmapWrapperRef}>
        <div className={styles.roadmapTimeline}></div>
        {roadmapCards.map((card, idx) => (
          <RoadmapCard
            key={idx}
            {...card}
            ref={card.isPrimary ? primaryCardRef : null}
          />
        ))}
      </div>
    </section>
  );
};

export default OurRoadmap;
