type TotalOGYSupply = {
  className?: string;
};

const TotalOGYSupply = ({ className, ...restProps }: TotalOGYSupply) => {
  return (
    <div className={`${className} card`} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content">Total OGY Supply</h2>
        <button className="text-sm font-medium text-content rounded-full px-3 py-1">
          Weekly
        </button>
      </div>
      <div className="mt-4 flex items-baseline text-2xl font-semibold text-gray-900">
        <span className="mr-2 text-green-500">
          {/* Icon can be replaced with actual SVG or font icon */}
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        </span>
        <span className="text-content">10 418 169 376,19 OGY</span>
      </div>
      {/* Placeholder for the graph */}
      <div className="mt-6 h-48 bg-gray-100 rounded-lg"></div>
    </div>
  );
};

export default TotalOGYSupply;
