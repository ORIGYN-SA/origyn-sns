import TopTransfersAndBurns from "./TopTransfersAndBurns";

const TopTransfersAndBurnsFull = ({
  type,
  title,
}: {
  type: "transfers" | "burns";
  title: string;
}) => {
  return <TopTransfersAndBurns type={type} title={title} limit={25} />;
};

export default TopTransfersAndBurnsFull;
