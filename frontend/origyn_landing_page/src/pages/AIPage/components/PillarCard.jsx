const PillarCard = ({ index, title, children }) => {
  const padded = String(index).padStart(2, "0");
  return (
    <article className="rounded-2xl border border-hairline bg-surface px-10 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="font-mono text-[44px] font-bold leading-none">
        <span className="text-gradient">{padded}</span>
      </div>
      <h3 className="mt-6 font-mono text-[14px]">
        <span className="text-gradient">{title}</span>
      </h3>
      <p className="mt-2 text-[14px] leading-[1.5] text-ink">{children}</p>
    </article>
  );
};

export default PillarCard;
