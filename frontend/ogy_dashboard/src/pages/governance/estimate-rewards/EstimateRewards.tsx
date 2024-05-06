import Card from "@components/ui/Card";

interface EstimateRewardsProps {
  className?: string;
}

const EstimateRewards = ({ className, ...restProps }: EstimateRewardsProps) => {
  return (
    <Card
      className={`${className} text-lg font-semibold text-content/60`}
      {...restProps}
    >
      Estimate rewards
    </Card>
  );
};

export default EstimateRewards;
