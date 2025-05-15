import { useEffect, useRef, useState } from "react";
import Button from "../Button/Button";
import Stats from "../Stats/Stats";
import styles from "./Hero.module.css";

const Hero = ({ data }) => {
  const bgRef = useRef(null);
  const ipadRef = useRef(null);
  const initialIpadY = useRef(0);
  const [scrollY, setScrollY] = useState(0);

  const statsData = [
    {
      value: data?.marketCap,
      title: "$OGY Market Cap",
    },
    {
      value: data?.users,
      title: "Users",
    },
    {
      value: data?.tvl,
      title: "Total Value Locked (TVL) of certified assets in usd",
    },
    {
      value: data?.assets,
      title: "Total Certified Assets",
    },
  ];

  useEffect(() => {
    const isDesktop = () => window.innerWidth >= 992;

    const setInitialIpadY = () => {
      if (ipadRef.current) {
        ipadRef.current.style.transform = "";
        ipadRef.current.getBoundingClientRect();
        const style = window.getComputedStyle(ipadRef.current);
        const matrix = new DOMMatrixReadOnly(style.transform);
        initialIpadY.current = matrix.m42;
      }
    };

    const handleScroll = () => {
      if (!isDesktop() && window.scrollY > 0) return;
      const scrollY = window.scrollY;
      setScrollY(scrollY);
      if (bgRef.current) {
        bgRef.current.style.transform = `translateY(${scrollY * 0.4}px)`;
      }
      if (ipadRef.current) {
        const y = initialIpadY.current + scrollY * 0.3;
        ipadRef.current.style.transform = `translateX(-50%) translateY(${y}px)`;
      }
    };

    const handleResize = () => {
      if (!isDesktop()) {
        if (bgRef.current) bgRef.current.style.transform = "";
        if (ipadRef.current) ipadRef.current.style.transform = "";
      } else {
        setInitialIpadY();
        handleScroll();
      }
    };

    if (isDesktop()) {
      setInitialIpadY();
      handleScroll();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className={styles.heroWithStats}>
      <div className={styles.heroContainer}>
        <img
          id="hero-bg-img"
          ref={bgRef}
          src="/ogy-background.png"
          alt="Background"
          className={styles.backgroundImage}
          style={{ willChange: "transform" }}
        />
        <div className={styles.contentWrapper}>
          <div className={styles.subtitle}>
            Secure your assets, intellectual property, and identity fully
            on-chain.
          </div>
          <div className={styles.titleWithButtons}>
            <img
              src="/origyn-logo-white-big.png"
              alt="ORIGYN Logo"
              className={styles.logo}
            />
            <div className={styles.buttonGroup}>
              <Button
                text="Certify your assets"
                onClick={() => {
                  const element = document.getElementById(
                    "certify-your-assets"
                  );
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              />
              <Button
                text={scrollY > 100 ? "Invest $OGY" : "Buy $OGY"}
                url="https://www.mexc.com/exchange/OGY_USDT"
              />
            </div>
          </div>
        </div>
        <img
          id="ipad-img"
          ref={ipadRef}
          src="/ipad-mock.png"
          alt="iPad Interface"
          className={styles.ipadMock}
          style={{ willChange: "transform" }}
        />
        <div className={styles.bottomText}>
          <span>
            ORIGYN allows you to securely store your data and assets fully
            on-chain • ORIGYN allows you to securely store your data and assets
            fully on-chain • ORIGYN allows you to securely store your data and
            assets fully on-chain • ORIGYN allows you to securely store your
            data and assets fully on-chain • ORIGYN allows you to securely store
            your data and assets fully on-chain • ORIGYN allows you to securely
            store your data and assets fully on-chain •
          </span>
        </div>
      </div>
      <Stats items={statsData} />
    </div>
  );
};

export default Hero;
