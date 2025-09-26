import { useState, useEffect } from "react";

const UseCasesSlideshow = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <img
      src={images[currentImageIndex]}
      alt={`Slideshow image ${currentImageIndex + 1}`}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
};

export default UseCasesSlideshow;
