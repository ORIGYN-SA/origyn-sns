// Draws the site's Open Graph cards on request. See README.md.
//
//   GET /<page id>/<locale>.jpg      ids come from src/seo/pages.ts

import satori from "satori";
import opentype from "@shuding/opentype.js";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import jpeg from "jpeg-js";
import {
  buildCard,
  cardFamilies,
  cardOptions,
  WEIGHTS,
  type FontFace,
  type Weight,
} from "../../src/seo/card.ts";
import { CARD_QUALITY, pageById, type PageSeo } from "../../src/seo/pages.ts";
import copy from "./copy.json";

type Env = { ASSETS: Fetcher };

const FALLBACK_LOCALE = "en";
// A redeploy is the only thing that changes a card, so crawlers can hold it.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

const WEIGHT_FILES: Record<Weight, string> = { 300: "Light", 400: "Regular" };

// Caches the promise, not the value, so concurrent first requests share a read.
const cached = new Map<string, Promise<unknown>>();
const once = <T>(key: string, make: () => Promise<T>): Promise<T> => {
  if (!cached.has(key)) cached.set(key, make());
  return cached.get(key) as Promise<T>;
};

let resvgReady: Promise<unknown> | null = null;

const asset = (env: Env, name: string): Promise<ArrayBuffer> =>
  once(`asset:${name}`, async () => {
    const response = await env.ASSETS.fetch(new URL(name, "https://assets.invalid"));
    if (!response.ok) throw new Error(`missing worker asset ${name}`);
    return response.arrayBuffer();
  });

const face = (env: Env, family: string, weight: Weight): Promise<FontFace> =>
  once(`face:${family}-${weight}`, async () => {
    const data = await asset(env, `/fonts/${family}-${WEIGHT_FILES[weight]}.ttf`);
    return { family, weight, data, metrics: opentype.parse(data) };
  });

const dataUri = (env: Env, name: string): Promise<string> =>
  once(`uri:${name}`, async () => {
    const bytes = new Uint8Array(await asset(env, name));
    // btoa needs a binary string, chunked to stay under the argument limit.
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    const mime = name.endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${btoa(binary)}`;
  });

const cards = copy as Record<string, Record<string, { title: string; lead: string }>>;

const draw = async (env: Env, page: PageSeo, locale: string): Promise<Uint8Array> => {
  const text = cards[locale][page.id];
  if (!text) throw new Error(`src/copy.json has no ${page.id} card; re-run npm run copy`);

  const fonts = await Promise.all(
    cardFamilies(locale).flatMap((family) => WEIGHTS.map((weight) => face(env, family, weight)))
  );

  const svg = await satori(
    // satori types its input as a React node, but also accepts the plain
    // element tree buildCard returns, which those types do not describe.
    buildCard({
      page,
      locale,
      title: text.title,
      lead: text.lead,
      fonts,
      art: page.card.layout === "type" ? undefined : await dataUri(env, `/art/${page.card.art.file}`),
      logo: await dataUri(env, "/origyn-logo-white.png"),
    }) as unknown as Parameters<typeof satori>[0],
    cardOptions(fonts)
  );

  resvgReady ??= initWasm(resvgWasm);
  await resvgReady;

  const rendered = new Resvg(svg).render();
  return jpeg.encode(
    { data: rendered.pixels, width: rendered.width, height: rendered.height },
    CARD_QUALITY
  ).data;
};

const problem = (status: number, message: string): Response =>
  new Response(`${message}\n`, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return problem(405, "Method not allowed");
    }

    const url = new URL(request.url);
    const route = /^\/([a-z0-9-]+)\/([A-Za-z-]{2,5})\.jpg$/.exec(url.pathname);
    if (!route) return problem(404, "Expected /<page>/<locale>.jpg");

    const page = pageById(route[1]);
    if (!page) return problem(404, `Unknown page "${route[1]}"`);

    // 404 rather than quietly minting an English card under an unknown locale.
    const locale = route[2];
    if (!(locale in cards)) return problem(404, `No card for locale "${locale}"`);

    const cache = caches.default;
    const hit = await cache.match(request);
    if (hit) return hit;

    // Missing copy or fonts beats a broken preview; the header makes it visible.
    let fallback = false;
    let image: Uint8Array;
    try {
      image = await draw(env, page, locale);
    } catch (error) {
      if (locale === FALLBACK_LOCALE) {
        return problem(500, `Could not draw ${page.id}: ${(error as Error).message}`);
      }
      console.error(`falling back to ${FALLBACK_LOCALE} for ${page.id}/${locale}:`, error);
      fallback = true;
      image = await draw(env, page, FALLBACK_LOCALE);
    }

    const response = new Response(image, {
      headers: {
        "content-type": "image/jpeg",
        "cache-control": CACHE_CONTROL,
        ...(fallback ? { "x-card-fallback": FALLBACK_LOCALE } : {}),
      },
    });
    ctx.waitUntil(cache.put(request, response.clone()));
    return response;
  },
};
