import { useState, useEffect, useRef } from "react";
import styles from "./OurPartners.module.scss";
import { partners } from "./partnersData";
import { testimonials } from "./testimonialsData";

const OurPartners = ({ id }) => {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const currentTestimonial = testimonials[currentTestimonialIndex];
  const intervalRef = useRef(null);
  const imagesRef = useRef({});
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    testimonials.forEach((testimonial) => {
      const img = new Image();
      img.src = testimonial.backgroundImage;
      imagesRef.current[testimonial.backgroundImage] = img;
    });
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentTestimonialIndex(
          (prevIndex) => (prevIndex + 1) % testimonials.length
        );
        setIsTransitioning(false);
      }, 500);
    }, 12000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentTestimonialIndex]);

  const handleIndicatorClick = (index) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentTestimonialIndex(index);
      setIsTransitioning(false);
    }, 500);
  };

  const navigateToNext = () => {
    const nextIndex = (currentTestimonialIndex + 1) % testimonials.length;
    handleIndicatorClick(nextIndex);
  };

  const navigateToPrev = () => {
    const prevIndex =
      currentTestimonialIndex === 0
        ? testimonials.length - 1
        : currentTestimonialIndex - 1;
    handleIndicatorClick(prevIndex);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      e.preventDefault();

      if (distance > 0) {
        navigateToNext();
      } else {
        navigateToPrev();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <>
      <div
        className={`${styles.container} ${isTransitioning ? styles.fadeOut : ""}`}
        id={id}
        style={{
          backgroundImage: `url(${currentTestimonial.backgroundImage})`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
        <div className={styles.bottomOurPartners}>PARTNERS</div>
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
