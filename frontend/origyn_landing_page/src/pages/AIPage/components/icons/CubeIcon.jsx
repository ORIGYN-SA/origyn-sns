const CubeIcon = (props) => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M17.0001 29.75C17.3967 29.75 17.7637 29.5701 18.4989 29.2088L24.4092 26.3132C27.0258 25.0311 28.3334 24.3893 28.3334 23.375V10.625M17.0001 29.75C16.6034 29.75 16.2365 29.5701 15.5012 29.2088L9.59091 26.3132C6.97433 25.0311 5.66675 24.3893 5.66675 23.375V10.625M17.0001 29.75V17"
      stroke="url(#cube-icon-bottom)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.5012 4.79117C16.2379 4.42992 16.6048 4.25 17.0001 4.25C17.3967 4.25 17.7637 4.42992 18.4989 4.79117L24.4092 7.68683C27.0258 8.96892 28.3334 9.61067 28.3334 10.625C28.3334 11.6393 27.0258 12.2811 24.4092 13.5632L18.4989 16.4588C17.7622 16.8201 17.3953 17 17.0001 17C16.6034 17 16.2365 16.8201 15.5012 16.4588L9.59091 13.5632C6.97433 12.2811 5.66675 11.6393 5.66675 10.625C5.66675 9.61067 6.97433 8.96892 9.59091 7.68683L15.5012 4.79117Z"
      stroke="url(#cube-icon-top)"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="cube-icon-bottom"
        x1="28.3334"
        y1="20.1875"
        x2="5.66675"
        y2="20.1875"
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
      <linearGradient
        id="cube-icon-top"
        x1="28.3334"
        y1="10.625"
        x2="5.66675"
        y2="10.625"
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

export default CubeIcon;
