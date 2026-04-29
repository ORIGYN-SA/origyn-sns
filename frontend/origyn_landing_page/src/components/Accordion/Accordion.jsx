import { useState, useEffect, useRef } from "react";
import styles from "./Accordion.module.scss";
import ScrollReveal from "@components/ScrollReveal/ScrollReveal";

export const AccordionItem = ({ icon, iconStyle, title, description, answer, isOpen, onToggle }) => {
  const contentRef = useRef(null);

  return (
    <div className={`${styles.accordionItem} ${isOpen ? styles.open : ""}`}>
      <div className={styles.accordionHeader} onClick={onToggle}>
        <div className={styles.accordionHeaderLeft}>
          {icon && (
            <div className={styles.iconContainer}>
              <img src={icon} alt={title} style={iconStyle} />
            </div>
          )}
          <div className={styles.headerContent}>
            <h3 className={styles.title}>{title}</h3>
            {description && <p className={styles.description}>{description}</p>}
            <div
              className={styles.accordionContentWrapper}
              style={{ height: isOpen ? contentRef.current?.scrollHeight ?? "auto" : 0 }}
            >
              <div ref={contentRef} className={styles.accordionContent}>
                <div
                  className={styles.answer}
                  dangerouslySetInnerHTML={{ __html: answer }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles.expandIcon} ${isOpen ? styles.rotated : ""}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

const Accordion = ({ items, resetDep, className }) => {
  const [openItems, setOpenItems] = useState(new Set());

  useEffect(() => {
    setOpenItems(new Set());
  }, [resetDep]);

  const toggleItem = (index) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <div className={`${styles.accordionContainer}${className ? ` ${className}` : ""}`}>
      {items.map((item, index) => (
        <ScrollReveal key={index} delay={index * 0.1}>
          <AccordionItem
            icon={item.icon}
            iconStyle={item.iconStyle}
            title={item.title}
            description={item.description}
            answer={item.answer}
            isOpen={openItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        </ScrollReveal>
      ))}
    </div>
  );
};

export default Accordion;
