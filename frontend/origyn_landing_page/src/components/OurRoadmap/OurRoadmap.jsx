import { useEffect, useRef, useState } from "react";
import styles from "./OurRoadmap.module.css";
import RoadmapCard from "./RoadmapCard";

const roadmapCards = [
  {
    title: "Support of the launch of Cecil DAO",
    description:
      "Successfully supported the launch of Cecil DAO, advancing decentralized funding for conservation and humanitarian initiatives through blockchain technology.",
    when: "Q1 2025",
    image: "/roadmap-q1.png",
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
];

const OurRoadmap = () => {
  const roadmapWrapperRef = useRef(null);
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
          <RoadmapCard key={idx} {...card} />
        ))}
      </div>
    </section>
  );
};

export default OurRoadmap;
