// satori shapes one glyph at a time: no bidi, no Arabic joining, no Indic
// reordering. These come out reversed or mis-stacked, so they get the English
// card instead.
const UNSHAPED_SCRIPTS = new Set(["ar", "bn", "he", "hi", "ur"]);

export const cardLocale = (locale: string): string =>
  UNSHAPED_SCRIPTS.has(locale) ? "en" : locale;
