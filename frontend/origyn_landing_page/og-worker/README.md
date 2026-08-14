# origyn-og

Draws the site's Open Graph cards on request.

```
GET https://origyn-og.bity-c61.workers.dev/<page id>/<locale>.jpg
```

Page ids come from [`src/seo/pages.ts`](../src/seo/pages.ts): `home`, `dpp`,
`use-case-gold` and so on. Locales are the ones that get a card of their own;
anything else is a 404.

## Why a worker

origyn.com is an IC asset canister, so anything the build emits is stored in the
canister forever. Eleven pages across thirty-one card locales is 341 images, and
almost none of them would ever be fetched. Here a card is drawn the first time
something asks for it, cached at the edge for a year, and the canister carries
none of it.

The site points at this worker through `VITE_OG_IMAGE_BASE_URL`, the same way it
points at `integrator-join` through `VITE_INTEGRATOR_JOIN_API_URL`. If the
worker is down, social previews lose their image; the pages themselves are
unaffected.

## Deploying

```
cd frontend/origyn_landing_page/og-worker
npx wrangler login          # once
npm run deploy
```

`npm run deploy` regenerates `src/copy.json` from the message catalogs first, so
the cards say what the catalogs say. That file is not committed.

**Redeploy the worker whenever the card copy changes**, otherwise it keeps
drawing the previous wording. Everything else it needs (fonts, artwork) is in
`assets/` and only changes when the design does.

`npm run dev` runs the same thing locally on http://localhost:8787.

## Changing how a card looks

The layout lives in [`src/seo/card.ts`](../src/seo/card.ts), shared with the
local preview so both draw the same thing. To see the result across every page
and locale without deploying:

```
cd frontend/origyn_landing_page
npm run og:cards            # writes .og-preview/<locale>/<page>.jpg
```

That is also the guard the build used to provide: it fails on a headline no
subset font can draw. Run it after changing copy, and after
`python3 scripts/build-og-fonts.py` if the change added a new script.

## Assets

| Path | Built by |
| --- | --- |
| `assets/fonts/*.ttf` | `scripts/build-og-fonts.py` |
| `assets/art/*` | `scripts/build-og-art.py` |
| `assets/origyn-logo-white.png` | committed as-is |

They are served through the `ASSETS` binding rather than bundled, so they do not
count against the worker's script size limit.
