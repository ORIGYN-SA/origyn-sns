import type { Locale } from "./config";

import en from "./messages/en.json";
import ar from "./messages/ar.json";
import bg from "./messages/bg.json";
import bn from "./messages/bn.json";
import cs from "./messages/cs.json";
import da from "./messages/da.json";
import de from "./messages/de.json";
import el from "./messages/el.json";
import es from "./messages/es.json";
import fi from "./messages/fi.json";
import fr from "./messages/fr.json";
import he from "./messages/he.json";
import hi from "./messages/hi.json";
import hr from "./messages/hr.json";
import hu from "./messages/hu.json";
import id from "./messages/id.json";
import it from "./messages/it.json";
import ja from "./messages/ja.json";
import ko from "./messages/ko.json";
import nl from "./messages/nl.json";
import no from "./messages/no.json";
import pl from "./messages/pl.json";
import pt from "./messages/pt.json";
import ptBR from "./messages/pt-BR.json";
import ro from "./messages/ro.json";
import ru from "./messages/ru.json";
import sv from "./messages/sv.json";
import sw from "./messages/sw.json";
import th from "./messages/th.json";
import tl from "./messages/tl.json";
import tr from "./messages/tr.json";
import uk from "./messages/uk.json";
import ur from "./messages/ur.json";
import vi from "./messages/vi.json";
import zh from "./messages/zh.json";
import zhTW from "./messages/zh-TW.json";

// Catalogs are eagerly imported and bundled with the AI route (which is already
// lazy-loaded). The JSON files are small; bundling them avoids the per-locale
// round-trips and loading states that code-splitting would add here. Missing
// keys in any catalog fall back to English (see getT), so a partial catalog
// still renders rather than showing blanks.
export const messages: Record<Locale, unknown> = {
  en,
  ar,
  bg,
  bn,
  cs,
  da,
  de,
  el,
  es,
  fi,
  fr,
  he,
  hi,
  hr,
  hu,
  id,
  it,
  ja,
  ko,
  nl,
  no,
  pl,
  pt,
  "pt-BR": ptBR,
  ro,
  ru,
  sv,
  sw,
  th,
  tl,
  tr,
  uk,
  ur,
  vi,
  zh,
  "zh-TW": zhTW,
};
