import { Row } from "@tanstack/react-table";
import type { NeuronRow } from "../NeuronsList";

const NeuronDetails = ({ row }: { row: Row<NeuronRow> }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3">
      {row?.original?.details.map(
        ({ label, value }: { label: string; value: string }) => (
          <div
            key={label}
            className="text-center p-4 border-r last:border-r-0 border-b border-border"
          >
            <div className="text-content/60">{label}</div>
            <div className="font-semibold">{value}</div>
          </div>
        )
      )}
    </div>
  );
};

export default NeuronDetails;
