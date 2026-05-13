const MetricCard = ({ value, suffix }) => (
  <div className="rounded-2xl border border-hairline bg-surface px-12 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
    <div className="text-center font-mono text-[60px] font-bold leading-[70px] tracking-[-0.06em]">
      <span className="text-gradient">
        {value}
        {suffix}
      </span>
    </div>
  </div>
);

export default MetricCard;
