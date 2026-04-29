import { useState, useEffect } from "react";

const UseCasesSlideshow = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const getRandomInterval = () => Math.random() * (5000 - 4000) + 4000; // Random 5-4 seconds
    let intervalId;

    const changeImage = () => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
      intervalId = setTimeout(changeImage, getRandomInterval());
    };

    intervalId = setTimeout(changeImage, getRandomInterval());

    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [images]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
      <img
        key={currentImageIndex}
        src={images[currentImageIndex]}
        alt={`Slideshow image ${currentImageIndex + 1}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          animation: "fadeIn 1s ease-in-out",
        }}
      />
    </>
  );
};

export default UseCasesSlideshow;
