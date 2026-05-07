export const getColorByProposalStatus = (
  status: string,
  type: "text" | "bg"
) => {
  switch (status) {
    case "Open":
      return type === "bg"
        ? "border border-sky/25 bg-sky/10"
        : "text-sky-700 dark:text-sky-300";
    case "Executed":
    case "Adopted":
      return type === "bg"
        ? "border border-jade/25 bg-jade/10"
        : "text-emerald-700 dark:text-emerald-300";
    case "Rejected":
    case "Failed":
      return type === "bg"
        ? "border border-red-500/25 bg-red-500/10"
        : "text-red-600 dark:text-red-300";
    default:
      return type === "bg"
        ? "border border-border-strong bg-surface-2"
        : "text-muted";
  }
};
