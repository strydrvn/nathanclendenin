# Comfort — Weather by Feel

A small iPhone-first weather web app whose whole point is a **Comfort rating** computed from
temperature + dew point. Styled after Apple Weather; the background tint shifts with how comfortable
it is outside (sky‑blue when lovely → amber when brutal).

This package is the **actual working app**, not a mockup to rebuild. It is a pure client‑side
static site — no backend, no build step, no API keys. Drop the `app/` folder on any static host
(Cloudflare Pages) and it runs.

---

## 1. What's in here

```
design_handoff_comfort_weather/
├── README.md          ← you are here
└── app/               ← deploy THIS folder
    ├── index.html     ← the app (a "Design Component" — see §6)
    ├── support.js     ← the tiny runtime that renders index.html
    └── image-slot.js  ← only used by the (currently hidden) mood feature — §7
```

`index.html` is the prototype file (was `Comfort Weather.dc.html`), renamed so Cloudflare serves it
at `/`. Nothing else changed.

---

## 2. How it runs (important)

`index.html` is authored as a **Design Component (DC)**: an HTML template plus a small JS logic
class, rendered by `support.js`. On load, `support.js`:

- pulls **React 18 + ReactDOM** from `unpkg.com` (public CDN, pinned + SRI),
- compiles the component, and mounts it.

So the app needs network access at runtime (it already does — it fetches live weather). There is **no
npm install and no build**. Editing = editing `index.html` directly (see §6).

> If you'd rather not depend on unpkg, self‑host those two UMD bundles next to `support.js` and
> change `REACT_URL` / `REACT_DOM_URL` at the bottom of `support.js`. Optional.

---

## 3. Deploy to Cloudflare Pages

**Dashboard:** Workers & Pages → Create → Pages → *Upload assets* → drag the **contents of `app/`** →
Deploy. No build command, no framework preset (it's static).

**CLI:**
```bash
npx wrangler pages deploy app --project-name=comfort-weather
```

Cloudflare serves it over HTTPS, which is required for the GPS/geolocation feature to work.

**Install on iPhone:** open the URL in Safari → Share → *Add to Home Screen*. The PWA meta tags in
`index.html` make it launch full‑screen with no browser chrome (Apple‑app feel).

---

## 4. Data sources (all free, no key, CORS‑enabled, client‑side)

| Use | Endpoint |
|---|---|
| Current + hourly + daily forecast | `https://api.open-meteo.com/v1/forecast` |
| City search (typeahead) | `https://geocoding-api.open-meteo.com/v1/search?name=…` |
| Name the GPS location (reverse geocode) | `https://api.bigdatacloud.net/data/reverse-geocode-client?…` |

The forecast call requests (Fahrenheit/mph, `timezone=auto`):

```
current = temperature_2m, relative_humidity_2m, apparent_temperature, dew_point_2m,
          weather_code, is_day, wind_speed_10m, wind_direction_10m
hourly  = temperature_2m, relative_humidity_2m, dew_point_2m
daily   = temperature_2m_max, temperature_2m_min, weather_code, sunrise, sunset
```

Per‑day **humidity** high/low (which Open‑Meteo's daily block doesn't provide) is derived by
bucketing the `hourly` arrays by local date and taking min/max. Temp high/low come from the `daily`
block. Default location is **Durham, NC**; GPS overrides it on launch if the user allows it. Last
location + saved cities persist in `localStorage` under key `comfortwx_v1`.

---

## 5. The Comfort model (the core idea — keep this intact if you refactor)

Comfort is driven by **dew point**, the metric that actually predicts mugginess, combined with a
temperature comfort band. All math is in °F. In `index.html`, see `comfortScore()`, `tierKey()`,
`comfortLabel()`, and `applyBackground()`.

```js
comfortScore(tempF, dewF):
  tempPenalty = 0                if 60 <= tempF <= 74      // the easy band
              = (tempF - 74)*2.2 if tempF > 74            // heat hurts faster
              = (60 - tempF)*1.5 if tempF < 60            // cool is more forgivable
  dewPenalty  = 0                          if dewF < 55
              = (dewF - 55)^1.35 * 1.15    otherwise      // mugginess ramps up
  score = clamp( round(100 - tempPenalty - dewPenalty), 0, 100 )
```

**Tiers** (score → label / subtitle / accent color):

| Score | Label | Subtitle | Color |
|---|---|---|---|
| ≥ 90 | Heaven! | About as good as it gets | `#86d8ff` |
| ≥ 80 | Lovely | Crisp and easy out there | `#82e3cb` |
| ≥ 68 | Pleasant | Comfortable, no complaints | `#a6e389` |
| ≥ 55 | Fair | Noticeable but livable | `#dcd884` |
| ≥ 42 | Sticky | Muggy and a little close | `#f0c27e` |
| ≥ 25 | Muggy | Heavy, damp air | `#f0a071` |
| < 25 | Brutal | Oppressive — stay cool | `#f08a8a` |

**Daily comfort** (for each forecast row) = average of the hourly `comfortScore` over that date's
daylight hours (08:00–20:00).

**Background tint** (`applyBackground`): one fixed hue per side — sky blue `oklch hue 234` when
score ≥ 50, amber `hue 50` when below — with chroma fading toward a neutral slate near the midpoint,
so the gradient never passes through green/teal. Darker at the top, lighter at the bottom.

The `dewWord()` helper labels the dew point itself (dry → comfortable → pleasant → sticky → humid →
oppressive → miserable) for the "Dew Point" card and the comfort sentence.

---

## 6. Editing `index.html` (the DC format in 90 seconds)

The file is `<x-dc>…template…</x-dc>` + `<script data-dc-script>class Component extends DCLogic {…}</script>`.

- **Template** = plain HTML with **inline styles only** (no CSS classes/stylesheets — that's a hard
  rule of this runtime). `{{ dotted.path }}` are value holes filled by the logic class.
- **Control flow**: `<sc-for list="{{ days }}" as="day">…</sc-for>` and
  `<sc-if value="{{ flag }}">…</sc-if>`.
- **Logic** = a React-class-like `Component` (has `state`, `setState`, lifecycle). `renderVals()`
  returns the object that fills the template holes. Weather fetching, the comfort math, search, and
  geolocation all live here.
- Weather icons are built as small inline SVGs in the `icon()` method.

To change copy or colors, edit the template text/inline styles directly. To change behavior or the
comfort thresholds, edit the logic class.

---

## 7. The hidden "Mood" feature (saved, currently OFF)

There's a playful module that shows a witty one‑liner per comfort tier (with a **↻ another** shuffle)
plus a **drop‑your‑own‑photo** frame for each mood (e.g. a beach shot for "Heaven", a meltdown meme
for "Brutal"). It's fully built but **hidden** per the client's request.

- **Re‑enable:** in `renderVals()` change `showMood: false` → `showMood: true`. The markup is wrapped
  in `<sc-if value="{{ showMood }}">`; the quotes, tiers, and reroll logic are in the `MOOD` object
  and `rerollMood()`.
- **Caveat for static hosting:** the photo frames use `image-slot.js`, which persists dropped images
  via a sidecar file that only the authoring runtime can write. On plain Cloudflare hosting the slots
  are **read‑only** (won't save a user's drop). If you ship Mood, swap the persistence for
  `localStorage` (store the dropped image as a data URL) or hard‑code curated images per tier.

---

## 8. Tweakable settings (props)

Defined in the `data-props` JSON on the `<script data-dc-script>` tag and read via `this.props`:

| Prop | Values | Default | Effect |
|---|---|---|---|
| `units` | `fahrenheit` \| `celsius` | `fahrenheit` | Display units (comfort math always runs in °F internally) |
| `forecastDays` | `5` \| `7` | `5` | Forecast length |
| `bgMode` | `comfort` \| `calm` | `comfort` | Comfort‑tinted background vs. a fixed calm sky |

The authoring runtime renders a little Tweaks panel for these; to set a permanent default for the
deployed site, just change the `default` in the `data-props` JSON.

---

## 9. Notes / gotchas

- **Geolocation needs HTTPS** (Cloudflare provides it) and a user permission prompt; it falls back to
  Durham, NC silently if denied or unavailable.
- Empty `{}` messages seen in the design preview console are **benign sandbox noise**
  (ResizeObserver / permission‑policy chatter); the live data, geocoding, and GPS all verified OK.
- Open‑Meteo is generous but not unlimited — fine for personal/app use; add a cache or your own proxy
  if it ever gets heavy traffic.
- No analytics, cookies, or tracking are included.
