const Card = ({ icon, title, subtitle, children, align = "center" }) => {
  const isLeft = align === "left";
  return (
    <article
      className={`rounded-3xl border border-[#ececec] bg-surface px-10 py-10 ${
        isLeft ? "text-left" : "text-center"
      }`}
    >
      {icon && (
        <div
          className={`mb-6 flex h-11 items-center ${
            isLeft ? "justify-start" : "justify-center"
          }`}
        >
          {icon}
        </div>
      )}
      <h3 className="text-xl font-medium tracking-tight text-ink md:text-[1.375rem]">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-2 text-[0.8125rem] uppercase tracking-[0.14em] text-muted">
          {subtitle}
        </p>
      )}
      <p className="mt-3 text-sm leading-[1.6] text-muted">{children}</p>
    </article>
  );
};

export default Card;
