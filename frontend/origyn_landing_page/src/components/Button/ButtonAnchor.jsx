import React from "react";
import styles from "./Button.module.scss";

const Button = ({ text, className, url }) => {
  return (
    <div className={`${styles.buttonWrapper} ${className || ""}`}>
      <a href={url} className={styles.button}>
        <span className={styles.buttonText}>{text}</span>
        <div className={styles.circle}>
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 8L8 0M8 4.13141V0H3.8686"
              stroke="white"
              strokeWidth="0.8"
              strokeMiterlimit="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </a>
    </div>
  );
};

export default Button;
