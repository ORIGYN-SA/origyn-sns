export const getColorByProposalStatus = (
  status: string,
  type: "text" | "bg"
) => {
  switch (status) {
    case "Open":
      return type === "bg" ? "bg-sky/20" : "text-sky";
    case "Executed":
    case "Adopted":
      return type === "bg" ? "bg-jade/20" : "text-jade";
    case "Rejected":
    case "Failed":
      return type === "bg" ? "bg-red-500/15" : "text-red-600";
    default:
      return type === "bg" ? "bg-border-faint" : "text-muted";
  }
};
