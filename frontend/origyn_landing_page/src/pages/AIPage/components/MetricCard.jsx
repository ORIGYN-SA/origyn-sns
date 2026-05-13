const MetricCard = ({ value, suffix }) => (
  <div className="text-center">
    <div className="text-[clamp(6rem,14vw,10rem)] font-extralight leading-none tracking-[-0.05em] text-ink">
      {value}
      <span className="font-normal italic">{suffix}</span>
    </div>
  </div>
);

export default MetricCard;
