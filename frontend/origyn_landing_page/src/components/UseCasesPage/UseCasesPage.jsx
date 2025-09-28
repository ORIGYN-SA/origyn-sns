import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import UseCasesSlideshow from "./UseCasesSlideshow";
import styles from "./UseCasesPage.module.css";

const useCaseData = {
  gold: [
    {
      title: "Gold",
      description:
        "As the world's largest asset and most closely monitored commodity, gold requires the highest levels of security. <br /><br />ORIGYN meets these requirements, as demonstrated by <a href='https://www.metalor.com/' target='_blank'>Metalor</a>, the world leader in gold refining, which chose ORIGYN protocol to secure their data. For the first time, all technical information related to gold bars - including high-definition images and documents - is recorded in a single certificate on the blockchain.",
      images: ["/uc-p-gold-1.jpg"],
    },
    {
      description:
        "Additionally, several projects like <a href='https://www.gold-dao.org/' target='_blank'>GoldDAO</a> and <a href='https://bity.com' target='_blank'>Bity</a> use these certificates to sell corresponding gold bars or create tokens backed by physical gold.",
      images: ["/uc-p-gold-2.jpg"],
    },
  ],
  art: [
    {
      title: "Art",
      description:
        "Art experts are deeply concerned about trust and the guarantee of certificates for artworks. This is why several cases have already adopted ORIGYN technology.<br /><br />Established artists like <a href='https://conormccreedy.com/' target='_blank'>Conor McCreedy</a> and <a href='https://www.leocaillard.com/' target='_blank'>Leo Caillard</a> have created their own ORIGYN certificates to protect the data related to their work. These certificates are fully on-chain, tamper-proof and impossible to copy, allowing artists to combat counterfeiting while improving the collector experience through high-definition images, videos, and documents.",
      images: ["/uc-p-art-1-1.jpg", "/uc-p-art-1-2.jpg", "/uc-p-art-1-3.jpeg"],
    },
    {
      description:
        "Entities like foundations, organizations, families, galleries, and art advisors who need to create digital certificates for their clients started to use ORIGYN to maintain maximum security and confidentiality. Several galleries have already implemented ORIGYN technology, including the Retelet Gallery for certificates of René Magritte artworks.<br /><br />ORIGYN technology also enables sales through certificates, particularly co-ownership sales. This allows artworks to be shared among multiple owners by dividing the certificate into several parts, each serving as proof of ownership.",
      images: ["/uc-p-art-2-1.jpg", "/uc-p-art-2-2.jpg"],
    },
  ],
  madein: [
    {
      title: "Made in",
      description:
        "National origin is more than a label. It is a declaration of identity, quality, and cultural value. As counterfeiting rises, proving where and how a product is made has become a key differentiator for brands across industries.<br /><br />In response, <a href='https://www.federitalyweb.it/' target='_blank'>Federitaly</a> created the 100% Made in Italy certification. This legally recognized standard protects Italian excellence through strict documentation, independent audits, and government-level advocacy. ORIGYN provides the digital foundation of this system by recording every certified product on the blockchain as a verifiable proof of origin.",
      images: [
        "/uc-p-made-in-1-1.jpg",
        "/uc-p-made-in-1-2.png",
        "/uc-p-made-in-1-3.png",
        "/uc-p-made-in-1-4.png",
      ],
    },
    {
      description:
        "Each certificate becomes a secure, tamper-proof digital passport. It reinforces consumer trust, ensures transparency across the supply chain, and supports businesses that choose to lead with authenticity.",
      images: ["/uc-p-made-in-2-1.jpg"],
    },
  ],
  luxury: [
    {
      title: "Luxury",
      description:
        "ORIGYN technology addresses the luxury sector's need to reinvent itself and offer more personalized, transparent product experiences.<br /><br />Jeweler <a href='http://www.suzannesyz.ch/' target='_blank'>Suzanne Syz</a> uses ORIGYN blockchain technology to create certificates for their entire collection. This secures all data fully on-chain while offering their prestigious customers next-generation certificates that guarantee confidentiality, authenticity, and ownership.",
      images: ["/uc-p-luxury-1-1.jpg"],
    },
    {
      description:
        "Other luxury companies like <a href='https://gil-sertissage.ch/' target='_blank'>Gil Sertissage</a> also use ORIGYN to record the complete traceability chain of their diamonds destined for renowned watchmakers.Many other applications are possible, including adding personalized marketing content to certificates or combining the technology with AI to determine authenticity in real time for secondary markets.",
      images: ["/uc-p-luxury-2-1.jpg"],
    },
  ],
};

const UseCaseMobile = ({ caseData }) => {
  return (
    <div className={styles.mobileContainer}>
      {caseData.map((item, index) => (
        <div key={index} className={styles.mobileItem}>
          {item.title && <h1 className={styles.mobileTitle}>{item.title}</h1>}
          <p
            className={styles.mobileDescription}
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
          <div className={styles.mobileImageContainer}>
            <UseCasesSlideshow images={item.images} />
          </div>
        </div>
      ))}
    </div>
  );
};

const UseCase = () => {
  const { title } = useParams();
  const caseData = useCaseData[title?.toLowerCase()];
  // const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!caseData) {
    return (
      <div className={styles.container}>
        <Header />
        <div className={styles.error}>
          <h1>Use case not found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  // const currentItem = caseData[currentIndex];

  return (
    <div className={styles.container}>
      <Header />
      {isMobile ? (
        <UseCaseMobile caseData={caseData} />
      ) : (
        <div className={styles.main}>
          {caseData.map((currentItem, index) => (
            <div className={styles.itemSection}>
              <div className={styles.leftContainer}>
                <div className={styles.content}>
                  <h1 className={styles.title}>{currentItem.title}</h1>
                  <p
                    className={styles.description}
                    dangerouslySetInnerHTML={{
                      __html: currentItem.description,
                    }}
                  />
                </div>
                <div className={styles.indicators}>
                  {caseData.map((_, indicatorIndex) => (
                    <button
                      key={indicatorIndex}
                      className={`${styles.indicator} ${
                        indicatorIndex === index ? styles.active : ""
                      }`}
                      // onClick={() => setCurrentIndex(index)}
                      aria-label={`Go to item ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.rightContainer}>
                <div className={styles.image}>
                  <UseCasesSlideshow images={currentItem.images} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default UseCase;
