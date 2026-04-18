export const capitalize = (value: string | undefined | null): string => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};
