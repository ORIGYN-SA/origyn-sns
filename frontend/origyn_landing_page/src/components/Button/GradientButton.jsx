import styles from "./GradientButton.module.scss";

const GradientButton = ({ text, href, onClick, className, target, rel, size = "regular" }) => {
  const Tag = href ? "a" : "button";

  return (
    <Tag
      href={href}
      onClick={onClick}
      target={target}
      rel={rel}
      className={`${styles.gradientButton} ${styles[size]} ${className || ""}`}
    >
      {text}
    </Tag>
  );
};

export default GradientButton;
