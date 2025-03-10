import Slider, { SliderThumb } from "@mui/material/Slider";
import { styled } from "@mui/material/styles";
import { Card } from "@components/ui";
import useEstimatedRewards from "@hooks/governance/useEstimatedRewards";
import { useState } from "react";

interface EstimateRewardsProps {
  className?: string;
}

const AirbnbSlider = styled(Slider)(({ theme }) => ({
  color: "#3a8589",
  height: 10,
  padding: "13px 0",
  "& .MuiSlider-thumb": {
    height: 27,
    width: 27,
    backgroundColor: "#fff",
    border: "1px solid currentColor",
    "&:hover": {
      boxShadow: "0 0 0 8px rgba(58, 133, 137, 0.16)",
    },
    "& .airbnb-bar": {
      height: 9,
      width: 1,
      backgroundColor: "currentColor",
      marginLeft: 1,
      marginRight: 1,
    },
  },
  "& .MuiSlider-track": {
    height: 10,
  },
  "& .MuiSlider-rail": {
    color: theme.palette.mode === "dark" ? "#bfbfbf" : "#d8d8d8",
    opacity: theme.palette.mode === "dark" ? undefined : 1,
    height: 10,
  },
}));

interface AirbnbThumbComponentProps extends React.HTMLAttributes<unknown> {}

function AirbnbThumbComponent(props: AirbnbThumbComponentProps) {
  const { children, ...other } = props;
  return (
    <SliderThumb {...other}>
      {children}
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
      <span className="airbnb-bar" />
    </SliderThumb>
  );
}

const EstimateRewards = ({ className, ...restProps }: EstimateRewardsProps) => {
  const { data, isSuccess, isError } = useEstimatedRewards();
  const [activeIndex, setActiveIndex] = useState(1);

  const handleOnChange = (event: Event) => {
    const value = Number((event.target as HTMLInputElement).value);
    if (value > 0 && value <= 5) {
      setActiveIndex(value);
    }
  };

  const placeholderData = [
    { rate: "0.0 %", locked: "0", lockedSum: "0", count: 0, countSum: 0 },
    { rate: "0.0 %", locked: "0", lockedSum: "0", count: 0, countSum: 0 },
    { rate: "0.0 %", locked: "0", lockedSum: "0", count: 0, countSum: 0 },
    { rate: "0.0 %", locked: "0", lockedSum: "0", count: 0, countSum: 0 },
    { rate: "0.0 %", locked: "0", lockedSum: "0", count: 0, countSum: 0 },
  ];

  const displayData = isSuccess && data ? data : placeholderData;

  return (
    <Card className={`${className} text-center xl:text-left`} {...restProps}>
      <h2 className="text-lg font-semibold text-content/60 mb-4">
        Estimate rewards
      </h2>

      <div className="w-full py-2 md:px-4 md:py-4 xl:px-0 2xl:px-4">
        <div className="gap-2">
          <div className="text-4xl mb-4 md:mb-8">
            {displayData[activeIndex - 1]?.rate || "N/A"}
          </div>
        </div>
        <AirbnbSlider
          slots={{ thumb: AirbnbThumbComponent }}
          aria-label="Restricted values"
          value={activeIndex}
          step={null}
          valueLabelDisplay="auto"
          min={1}
          max={5}
          marks={displayData.map((_item, index) => ({
            value: index + 1,
          }))}
          onChange={(event) => handleOnChange(event)}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {activeIndex < 5 && (
            <div className="flex justify-center">
              <div className="flex flex-col items-start">
                <div className="flex flex-row space-x-4 items-center text-2xl font-semibold md:space-x-4">
                  <img
                    src="/ogy_logo.svg"
                    alt="OGY Logo"
                    className="h-12 w-12 2xl:w-14 2xl:h-14 object-contain"
                  />
                  <div className="flex flex-col text-left">
                    <div className="flex items-baseline">
                      <span className="text-2xl">
                        {displayData[activeIndex - 1]?.lockedSum || "0"}
                      </span>
                      <span className=" ml-1 text-content/60 text-lg 2xl:text-2xl">
                        OGY
                      </span>
                    </div>
                    <div className="text-content/60 text-base font-light">
                      <span className="text-content font-semibold">
                        {displayData[activeIndex - 1]?.countSum || "0"}
                      </span>{" "}
                      participants
                    </div>
                  </div>
                </div>
                <div className="text-content/60 mt-0 md:mt-2 text-center">
                  currently locked for at least {activeIndex} year
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <div className="flex flex-col items-start">
              <div className="flex flex-row space-x-4 items-center text-2xl font-semibold md:space-x-4 2xl:space-x-4">
                <img
                  src="/ogy_logo.svg"
                  alt="OGY Logo"
                  className="h-12 w-12 2xl:w-14 2xl:h-14 object-contain"
                />
                <div className="flex flex-col text-left">
                  <div className="flex items-baseline">
                    <span className="text-2xl">
                      {displayData[activeIndex - 1]?.locked || "0"}
                    </span>
                    <span className=" ml-1 text-content/60 text-lg 2xl:text-2xl">
                      OGY
                    </span>
                  </div>
                  <div className="text-content/60 text-base font-light">
                    <span className="text-content font-semibold">
                      {displayData[activeIndex - 1]?.count || "0"}
                    </span>{" "}
                    participants
                  </div>
                </div>
              </div>
              <div className="text-content/60 mt-0 md:mt-3">
                currently locked for {activeIndex} year
              </div>
            </div>
          </div>
        </div>
        {isError && (
          <div className="text-red-500 text-sm italic">
            Failed to load data.
          </div>
        )}
      </div>
    </Card>
  );
};

export default EstimateRewards;
