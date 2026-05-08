interface IProgressBarProps {
  yesCount: number;
  noCount: number;
}

const ProgressBar = ({ yesCount, noCount }: IProgressBarProps) => {
  const totalCount = yesCount + noCount;
  const minPercentage = 3;
  let yesPercentage = totalCount > 0 ? (yesCount / totalCount) * 100 : 0;
  let noPercentage = totalCount > 0 ? (noCount / totalCount) * 100 : 0;

  if (yesPercentage > 0 && yesPercentage < minPercentage) {
    yesPercentage = minPercentage;
  }
  if (noPercentage > 0 && noPercentage < minPercentage) {
    noPercentage = minPercentage;
  }

  const totalPercentage = yesPercentage + noPercentage;
  if (totalPercentage > 100) {
    if (yesPercentage > noPercentage) {
      yesPercentage -= totalPercentage - 100;
    } else {
      noPercentage -= totalPercentage - 100;
    }
  }

  return (
    <div className="w-full h-4 flex rounded-full overflow-hidden">
      <div
        style={{ width: `${yesPercentage}%` }}
        className="bg-jade transition-all ease-in-out duration-300"
      />
      <div
        style={{ width: `${100 - yesPercentage}%` }}
        className="bg-red-400 transition-all ease-in-out duration-300"
      />
    </div>
  );
};

export default ProgressBar;
