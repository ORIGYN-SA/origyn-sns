import { useState, useEffect, useRef } from "react";
import styles from "./OurPartners.module.css";
import { partners } from "./partnersData";
import { testimonials } from "./testimonialsData";

const OurPartners = ({ id }) => {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const currentTestimonial = testimonials[currentTestimonialIndex];
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentTestimonialIndex(
        (prevIndex) => (prevIndex + 1) % testimonials.length
      );
    }, 8000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTestimonialIndex]);

  const handleIndicatorClick = (index) => {
    setCurrentTestimonialIndex(index);
  };

  return (
    <>
      <div
        className={styles.container}
        id={id}
        style={{
          backgroundImage: `url(${currentTestimonial.backgroundImage})`,
        }}
      >
        <div className={styles.left}>
          <h1 className={styles.leftTitle}>
            {currentTestimonial.nameOne}{" "}
            <span>{currentTestimonial.nameTwo}</span>
          </h1>
          <p className={styles.leftSubtitle}>{currentTestimonial.title}</p>
          <p className={styles.leftDescription}>
            {currentTestimonial.description}
          </p>
          {currentTestimonial.signature && (
            <img
              className={styles.signature}
              src={currentTestimonial.signature}
              alt="signature"
            />
          )}
        </div>
        {currentTestimonial.image && (
          <div className={styles.right}>
            <img src={currentTestimonial.image} alt="testimonial" />
          </div>
        )}
        <div className={styles.indicators}>
          {testimonials.map((_, index) => (
            <div
              key={index}
              className={`${styles.indicator} ${
                index === currentTestimonialIndex ? styles.active : ""
              }`}
              onClick={() => handleIndicatorClick(index)}
            />
          ))}
        </div>
      </div>
      <div className={styles.bottom}>
        <div className={styles.bottomOurPartners}>OUR PARTNERS</div>
        <div className={styles.partnersContainer}>
          {[...partners, ...partners, ...partners].map((partner, index) => (
            <img
              key={`${partner.id}-${index}`}
              className={styles.partnerLogo}
              src={partner.logo}
              alt={partner.name}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default OurPartners;
