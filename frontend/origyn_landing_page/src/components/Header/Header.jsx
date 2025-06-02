import React, { useState, useEffect } from "react";
import styles from "./Header.module.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <a href="/" className={styles.logoContainer}>
          <img
            src="/origyn-logo-white.png"
            alt="ORIGYN Logo"
            className={styles.logo}
          />
        </a>
        <button
          className={`${styles.burgerMenu} ${isMenuOpen ? styles.open : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <nav className={`${styles.nav} ${isMenuOpen ? styles.open : ""}`}>
          <a
            href="https://origyn.gitbook.io/origyn/use-cases/certificates-of-authenticity"
            className={styles.navLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            CERTIFICATES
          </a>
          <a
            onClick={() => handleNavClick("integrator-program")}
            className={styles.navLink}
          >
            INTEGRATORS
          </a>
          <a
            onClick={() => handleNavClick("our-partners")}
            className={styles.navLink}
          >
            ECOSYSTEM
          </a>
          <a
            onClick={() => handleNavClick("use-cases")}
            className={styles.navLink}
          >
            USE CASES
          </a>
          <a
            href="https://coinmarketcap.com/currencies/origyn-foundation/"
            className={styles.navLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            OGY TOKEN
          </a>
          <a
            href="https://dashboard.origyn.com"
            className={styles.navLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            DASHBOARD
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
