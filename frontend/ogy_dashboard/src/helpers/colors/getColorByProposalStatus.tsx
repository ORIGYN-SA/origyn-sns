export const getColorByProposalStatus = (status: string) => {
  switch (status) {
    case "Open":
      return "sky";
    case "Executed":
      return "jade";
    default:
      return "";
  }
};
