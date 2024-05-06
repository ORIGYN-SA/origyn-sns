import { Row } from "@tanstack/react-table";

const NeuronDetails = ({ row }: { row: Row<T> }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {row?.original?.details.map(({ label, value }) => (
        <div
          key={label}
          className="text-center p-4 border-r border-border last:border-r-0"
        >
          <div className="text-content/60">{label}</div>
          <div className="font-semibold">{value}</div>
        </div>
      ))}
    </div>
  );
};

// {
//   "state": "Not dissolving"
//   "votingPower": "16964893218.85",
//   "dissolveDelay": 15780096,
//   "age": "last month",
// }
export default NeuronDetails;
