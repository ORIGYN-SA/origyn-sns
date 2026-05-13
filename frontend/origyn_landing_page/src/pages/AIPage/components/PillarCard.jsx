const PillarCard = ({ index, title, children }) => {
  const padded = String(index).padStart(2, "0");
  return (
    <article className="rounded-3xl border border-[#ececec] bg-surface px-10 py-10 transition-colors duration-200 hover:border-ink/20 hover:bg-black/[0.015]">
      <div className="text-[clamp(2.5rem,5vw,3.5rem)] font-extralight leading-none tracking-[-0.04em]">
        <span className="text-gradient">{padded}</span>
      </div>
      <h3 className="mt-6 text-xl font-medium tracking-tight text-ink md:text-[1.375rem]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-[1.6] text-muted">{children}</p>
    </article>
  );
};

export default PillarCard;
