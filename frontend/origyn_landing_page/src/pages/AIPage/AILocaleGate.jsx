import { Navigate } from "react-router-dom";
import { negotiateLocale } from "@/i18n/negotiate";

// /ai carries no locale: resolve the best one (prior choice -> browser
// languages -> default) and redirect to the prefixed route.
const AILocaleGate = () => <Navigate to={`/ai/${negotiateLocale()}`} replace />;

export default AILocaleGate;
