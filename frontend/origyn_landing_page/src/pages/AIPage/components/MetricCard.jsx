const MetricCard = ({ value, suffix }) => (
  <div className="rounded-2xl border border-hairline bg-surface px-14 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
    <div className="text-[80px] font-bold leading-none">
      <span className="text-navy">{value}</span>
      <span className="text-[#1F9CD4]">{suffix}</span>
    </div>
  </div>
);

export default MetricCard;
