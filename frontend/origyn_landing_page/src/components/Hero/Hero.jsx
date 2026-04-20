import { useEffect, useRef, useState } from "react";
import Button from "@components/Button/Button";
import Stats from "@components/Stats/Stats";
import styles from "./Hero.module.scss";

const Hero = ({ data }) => {
  const bgRef = useRef(null);
  const ipadRef = useRef(null);
  const initialIpadY = useRef(0);
  // eslint-disable-next-line no-unused-vars
  const [scrollY, setScrollY] = useState(0);
  const [ipadLoaded, setIpadLoaded] = useState(false); // NEW

  const statsData = [
    {
      value: data?.marketCap,
      title: "$OGY Market Cap",
      tooltip:
        "The total market value of all OGY tokens currently in circulation, based on the live token price.",
    },
    {
      value: data?.tvl,
      title: "Total Value Locked (TVL) of certified assets in usd",
      tooltipTitle: "Total Value Locked (TVL)",
      tooltip:
        "TVL corresponds to the value of the issued certificates; this does not mean that ORIGYN holds these assets in custody.",
    },
    {
      value: data?.users,
      title: "Users",
      tooltip:
        "The total number of individuals, brands, and institutions who actively use ORIGYN to issue, manage, or own certified assets.",
    },
    {
      value: data?.assets,
      title: "Total Certified Assets",
      tooltip:
        "The number of physical or digital items that have received an official ORIGYN certificate.",
    },
  ];

  useEffect(() => {
    if (!ipadLoaded) return; // Wait for image to load

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
      if (!isDesktop()) return;
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
  }, [ipadLoaded]); // Only run after image is loaded

  return (
    <div className={styles.heroWithStats}>
      <div className={styles.heroContainer}>
        <video
          id="hero-bg-img"
          ref={bgRef}
          className={styles.backgroundImage}
          style={{ willChange: "transform" }}
          autoPlay
          loop
          muted
          playsInline
        >
          <source
            src="https://pub-1832d2c733894370a7282135b65cc177.r2.dev/claimlink_login_bg_video.mp4"
            type="video/mp4"
          />
        </video>
        <div className={styles.contentWrapper}>
          <div className={styles.subtitleDesktop}>
            Secure your assets, intellectual property, <br />
            and identity fully on-chain.
          </div>
          <div className={styles.subtitleMobile}>
            Secure your assets, <br />
            intellectual property, <br />
            and identity fully on-chain.
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
                    "certify-your-assets",
                  );
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              />
              <div className={styles.buyButtonWrapper}>
                <Button
                  text="Buy $OGY"
                  url="https://www.mexc.com/exchange/OGY_USDT"
                />
              </div>
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
          onLoad={() => setIpadLoaded(true)}
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
