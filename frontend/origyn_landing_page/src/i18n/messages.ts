import type { Locale } from "./config";

import en from "./messages/en.json";
import fr from "./messages/fr.json";
import de from "./messages/de.json";
import it from "./messages/it.json";
import zh from "./messages/zh.json";

// Catalogs are eagerly imported and bundled with the AI route (which is already
// lazy-loaded). Five small JSON files are cheaper than the round-trips and
// loading states that per-locale code-splitting would add here.
export const messages: Record<Locale, unknown> = { en, fr, de, it, zh };
