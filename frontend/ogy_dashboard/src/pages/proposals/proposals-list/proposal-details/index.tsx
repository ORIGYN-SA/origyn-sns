import { Row } from "@tanstack/react-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProposalDetails = ({ row }: { row: Row<any> }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-1">
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

export default ProposalDetails;
