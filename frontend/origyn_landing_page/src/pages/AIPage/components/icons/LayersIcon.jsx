const LayersIcon = (props) => (
  <svg
    width="31"
    height="31"
    viewBox="0 0 31 31"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.00024 15.5L15.4849 22.75L30.0002 15.5M1.00024 22.75L15.4849 30L30.0002 22.75M1.00024 8.53456L15.4993 15.5L30.0002 8.53456L15.4993 1L1.00024 8.53456Z"
      stroke="url(#layers-icon)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="layers-icon"
        x1="30.0002"
        y1="15.5"
        x2="1.00024"
        y2="15.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.03" stopColor="#1F9CD4" />
        <stop offset="0.3" stopColor="#1470B1" />
        <stop offset="0.36" stopColor="#1A5EA2" />
        <stop offset="0.44" stopColor="#214B92" />
        <stop offset="0.53" stopColor="#254088" />
        <stop offset="0.63" stopColor="#263C85" />
        <stop offset="0.69" stopColor="#25397E" />
        <stop offset="0.79" stopColor="#223169" />
        <stop offset="0.9" stopColor="#1E2448" />
        <stop offset="0.91" stopColor="#1E2345" />
      </linearGradient>
    </defs>
  </svg>
);

export default LayersIcon;
