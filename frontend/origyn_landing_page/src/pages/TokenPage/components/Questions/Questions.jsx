import Accordion from "@components/Accordion/Accordion";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";
import styles from "./Questions.module.scss";

const Questions = () => {
  const questions = [
  {
    title: "What makes OGY a deflationary token?",
    answer: "OGY is designed with a deflationary model, meaning its total supply decreases over time as the protocol is used.",
  },
  {
    title: "How does the token burn work?",
    answer: "Every time OGY is used for certification, a portion of the tokens is permanently burned. This reduces the circulating supply.",
  },
  {
    title: "What is the role of the treasury?",
    answer: "Protocol revenue is managed by the treasury to support ongoing development, reward participants, and help maintain long-term ecosystem stability.",
  },
  {
    title: "How does OGY create value over time?",
    answer: "As more users adopt the ORIGYN protocol and certification activity increases, more OGY is burned. This decreasing supply, combined with growing usage, supports long-term value creation.",
  }
];


  return (
    <section className={styles.questions}>
      <h1>
        <ScrollReveal>
          <b>Deflationary</b> Mechanics
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          and <b>Value Accrual</b>
        </ScrollReveal>
      </h1>
      <ScrollReveal delay={0.25}>
        <p>OGY integrates a deflationary model designed for sustainable growth:</p>
      </ScrollReveal>
      <Accordion
        items={questions}
        className={styles.questionsContainer}
      />

    </section>
  )
}

export default Questions;