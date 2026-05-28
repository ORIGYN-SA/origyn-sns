import { useEffect } from "react";
import { useParams } from "react-router-dom";
import PageLayout from "@components/PageLayout";
import UseCasesSlideshow from "./components/UseCasesSlideshow";
import UseCaseMobile from "./components/UseCaseMobile";
import useIsMobile from "@/hooks/useIsMobile";
import { useT } from "@/i18n/LocaleContext";
import styles from "./UseCasesPage.module.scss";

// Image lists are static (per slug); titles + body text are translatable.
const IMAGES_BY_SLUG = {
  gold: [["/uc-p-gold-1.png"], ["/uc-p-gold-2.jpg"]],
  art: [
    [
      "/uc-p-art-1-1.jpg",
      "/uc-p-art-1-2.png",
      "/uc-p-art-1-3.png",
      "/uc-p-art-1-4.png",
    ],
    ["/uc-p-art-2-1.png"],
  ],
  madein: [
    [
      "/uc-p-made-in-1-1.png",
      "/uc-p-made-in-1-2.png",
      "/uc-p-made-in-1-3.png",
      "/uc-p-made-in-1-4.png",
    ],
    ["/uc-p-made-in-2-1.png"],
  ],
  luxury: [["/uc-p-luxury-1-1.jpg"], ["/uc-p-luxury-2-1.png"]],
};

const UseCasesPage = () => {
  const t = useT();
  const { title } = useParams();
  const slug = title?.toLowerCase();
  const cases = t.raw(`useCase.cases.${slug}`);
  const images = IMAGES_BY_SLUG[slug];
  const caseData = Array.isArray(cases) && images
    ? cases.map((entry, i) => ({ ...entry, images: images[i] ?? [] }))
    : null;
  const { isMobile } = useIsMobile();

  useEffect(() => {
    if (!caseData) return;

    const preloadImages = () => {
      const allImages = caseData.flatMap((item) => item.images);

      allImages.forEach((imageSrc) => {
        const img = new Image();
        img.src = imageSrc;
      });
    };

    preloadImages();
  }, [caseData]);

  if (!caseData) {
    return (
      <div className={styles.container}>
        <PageLayout>
          <div className={styles.error}>
            <h1>{t("useCase.notFound")}</h1>
          </div>
        </PageLayout>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageLayout>
        {isMobile ? (
          <UseCaseMobile caseData={caseData} />
        ) : (
          <div className={styles.main}>
            {caseData.map((currentItem, idx) => (
              <div key={idx} className={styles.itemSection}>
                <div className={styles.leftContainer}>
                  <div className={styles.content}>
                    {currentItem.title && (
                      <h1 className={styles.title}>{currentItem.title}</h1>
                    )}
                    <p
                      className={styles.description}
                      dangerouslySetInnerHTML={{
                        __html: currentItem.description,
                      }}
                    />
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
      </PageLayout>
    </div>
  );
};

export default UseCasesPage;
