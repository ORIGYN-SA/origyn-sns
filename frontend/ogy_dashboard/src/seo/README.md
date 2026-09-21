# Dashboard SEO and social images

`pages.ts` maps dashboard routes to translated catalog keys and shared website card layouts. `meta.ts` builds metadata for both the Vite build and `Seo.tsx`, which updates the document head when the route, detail identifier or language changes.

The production build emits an HTML document for each fixed route in all 36 languages, plus unprefixed English entry points. These contain titles, descriptions, canonical and alternate URLs, Open Graph tags and X cards before JavaScript runs. Public fixed routes also appear in `sitemap.xml`.

Account, recovery, support, query-based detail pages and unknown routes use `noindex`. Canonicals exclude filters and tracking parameters and preserve the `id` query parameter on proposal and neuron details.

## Review locally

Run from the repository root with Node 22.6 or newer:

```sh
npm ci
npm run build:production --workspace ogy_dashboard
npm run seo:check --workspace ogy_dashboard
npm run seo:review --workspace ogy_dashboard
python3 -m http.server 4174 --bind 127.0.0.1 --directory frontend/ogy_dashboard/.seo-review
```

Open <http://127.0.0.1:4174>. Select any language and page to see the actual rendered card, title, description, canonical URL and complete metadata. Review links preserve the selections in the query string. The review page is a local artifact, excluded from Git and the production bundle.

The review renders 744 JPEGs with the same Satori, Resvg and JPEG encoder used by the website and Worker. Arabic, Bengali, Hebrew, Hindi and Urdu retain localized metadata but use English images because the renderer cannot shape those scripts. The review labels these fallbacks.

## Release

The existing Worker in `frontend/origyn_landing_page/og-worker` serves both applications. Dashboard images have distinct URLs such as `https://og.bity.com/dashboard-governance/fr.jpg`; website URLs stay the same. Cards are 1200 × 630 JPEGs at quality 85.

Deploy the Worker before releasing the dashboard:

```sh
cd frontend/origyn_landing_page/og-worker
npm run deploy
```

Check a dashboard image URL, then build and release the dashboard through its normal pipeline. `VITE_SITE_URL` controls canonicals and the sitemap; `VITE_OG_IMAGE_BASE_URL` controls image URLs. All deployment environments use `og.bity.com`.

After changing card copy, regenerate the shared font subsets with `python3 frontend/origyn_landing_page/scripts/build-og-fonts.py` and rerun the review. The font script requires `fonttools[woff]` and includes both applications' text. Images have long-lived cache headers, as on the website; changing an existing image requires cache invalidation or a new image URL.

## Dynamic detail routes

The static asset canister cannot render HTML for arbitrary certificate IDs, transaction indexes or account addresses. Those routes receive the generic dashboard HTML on a direct request, then get route-specific metadata after the app starts. Their titles include the identifier during browser navigation. The review marks these routes as browser-only metadata and shows route placeholders.

Crawler-specific metadata for individual records requires request-time HTML rendering in front of the canister. The fixed pages and their localized previews work without it.
