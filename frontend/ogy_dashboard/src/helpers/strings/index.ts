export const capitalize = (value: string | undefined | null): string => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export const shortenId = (value: string): string =>
  value.length > 20 ? `${value.slice(0, 11)}...${value.slice(-6)}` : value;
