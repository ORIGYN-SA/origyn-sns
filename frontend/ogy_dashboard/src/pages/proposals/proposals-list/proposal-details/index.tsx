import type { ReactNode } from "react";
import { Row } from "@tanstack/react-table";
import type { ProposalRow } from "../ProposalsList";

const ProposalDetails = ({ row }: { row: Row<ProposalRow> }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-0">
      {row?.original?.details.map(
        ({ label, value }: { label: string; value: ReactNode }) => (
          <div
            key={label}
            className="text-center p-4 border-e last:border-e-0 border-b border-border"
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
