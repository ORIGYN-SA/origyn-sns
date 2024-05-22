export const getColorByProposalStatus = (
  status: string,
  type: "text" | "bg"
) => {
  switch (status) {
    case "Open":
      return type === "bg" ? "bg-sky/20" : "text-sky";
    case "Executed":
      return type === "bg" ? "bg-jade/20" : "text-jade";
    default:
      return "";
  }
};
