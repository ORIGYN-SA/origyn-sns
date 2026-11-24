import { useEffect } from "react";
import { useRouteError } from "react-router-dom";

const RELOADED_AT = "gldt-chunk-reload-at";

/** A page that failed to render. A page whose code failed to load means a release replaced the
 * site's files while it was open: the page reloads once to get the new ones. */
const RouteError = () => {
  const error = useRouteError();
  const missingChunk =
    error instanceof Error && /dynamically imported module|importing a module script failed|error loading dynamically/i.test(error.message);
  useEffect(() => {
    if (!missingChunk) return;
    try {
      const last = Number(sessionStorage.getItem(RELOADED_AT) ?? 0);
      if (Date.now() - last < 30_000) return;
      sessionStorage.setItem(RELOADED_AT, String(Date.now()));
    } catch {
      // Without storage, reload anyway: a loop is stopped by the browser's own reload of the same error.
    }
    window.location.reload();
  }, [missingChunk]);
  return (
    <div className="flex h-screen">
      <div className="m-auto text-center">
        <div className="mb-4">Something went wrong while loading this page.</div>
        <button type="button" className="underline" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </div>
  );
};

export default RouteError;
