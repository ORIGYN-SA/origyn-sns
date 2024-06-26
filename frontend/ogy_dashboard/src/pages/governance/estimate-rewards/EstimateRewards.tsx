import Slider, {
  SliderThumb,
  // SliderValueLabelProps,
} from "@mui/material/Slider";
import { Mark } from "@mui/base/useSlider";
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
  const { data, isSuccess } = useEstimatedRewards();
  const [activeIndex, setActiveIndex] = useState(1);

  const handleOnChange = (v: Event) => {
    setActiveIndex(Number((v.target as HTMLInputElement).value));
  };

  return (
    <Card className={`${className} text-center xl:text-left`} {...restProps}>
      <h2 className="text-lg font-semibold text-content/60 mb-4">
        Estimate rewards
      </h2>
      {isSuccess && data && (
        <div className="w-full px-4 py-4">
          <div className="gap-2">
            <div className="text-4xl mb-8">{data[activeIndex - 1].rate}</div>
          </div>
          <AirbnbSlider
            slots={{ thumb: AirbnbThumbComponent }}
            aria-label="Restricted values"
            value={activeIndex}
            // getAriaValueText={valuetext}
            step={null}
            valueLabelDisplay="auto"
            min={1}
            max={5}
            marks={data as Mark[]}
            onChange={(v) => handleOnChange(v)}
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-6">
            {activeIndex < 5 && (
              <div className="flex flex-col items-center xl:items-start">
                <div className="flex items-center justify-center text-2xl font-semibold">
                  <img src="/ogy_logo.svg" alt="OGY Logo" />
                  <span className="ml-2 mr-3">
                    {data[activeIndex - 1].lockedSum}
                  </span>
                  <span className="text-content/60">OGY</span>
                </div>
                <div className="text-content/60">
                  currently locked for at least {activeIndex} year
                </div>
              </div>
            )}
            <div className="flex flex-col items-center xl:items-start">
              <div className="flex items-center text-2xl font-semibold">
                <img src="/ogy_logo.svg" alt="OGY Logo" />
                <span className="ml-2 mr-3">
                  {data[activeIndex - 1].locked}
                </span>
                <span className="text-content/60">OGY</span>
              </div>
              <div className="text-content/60">
                currently locked for {activeIndex} year
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EstimateRewards;
