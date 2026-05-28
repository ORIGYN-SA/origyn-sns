import Accordion from "@components/Accordion/Accordion";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import { useT } from "@/i18n/LocaleContext";
import styles from "./Questions.module.scss";

const Questions = () => {
  const t = useT();
  const questions = t.raw("token.questions.items") ?? [];

  return (
    <section className={styles.questions}>
      <h1>
        <ScrollReveal>
          <span dangerouslySetInnerHTML={{ __html: t("token.questions.titleLineOnePrefix") }} />
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <span dangerouslySetInnerHTML={{ __html: t("token.questions.titleLineTwo") }} />
        </ScrollReveal>
      </h1>
      <ScrollReveal delay={0.25}>
        <p>{t("token.questions.lead")}</p>
      </ScrollReveal>
      <Accordion items={questions} className={styles.questionsContainer} />
    </section>
  );
};

export default Questions;
