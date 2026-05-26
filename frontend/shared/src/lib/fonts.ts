// The typeface shared components render in, matching the dashboard. Applied
// explicitly (not via Tailwind's font-sans) so it stays DM Sans even when
// embedded in an app whose body font differs (e.g. the landing page's General
// Sans). DM Sans is loaded by tokens.css and the dashboard's index.html.
export const FONT_FAMILY = '"DM Sans", system-ui, sans-serif';
