const Card = ({ icon, title, subtitle, children, align = "center" }) => {
  const isLeft = align === "left";
  return (
    <article
      className={`rounded-2xl border border-hairline bg-surface px-8 py-10 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
        isLeft ? "text-left" : "text-center"
      }`}
    >
      {icon && (
        <div
          className={`mb-6 flex ${
            isLeft ? "justify-start" : "justify-center"
          }`}
        >
          {icon}
        </div>
      )}
      <h3 className="font-mono text-[15px] tracking-[0.05em] text-navy">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-3 text-[14px] font-medium text-navy">{subtitle}</p>
      )}
      <p className="mt-6 text-[14px] leading-[1.6] text-muted">{children}</p>
    </article>
  );
};

export default Card;
