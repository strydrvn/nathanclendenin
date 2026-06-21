# Meal Planner with Price Tracking

A mobile-first web app for meal planning, grocery shopping, and tracking grocery prices across stores. Styled after the NYT Cooking editorial aesthetic.

## Features

- **Recipes** — Store your recipe library with ingredients. Add manually, paste & parse with AI, or upload a photo/PDF of a recipe page.
- **Shopping List** — Add items or pull missing ingredients from any recipe. Items auto-assign to a store (defaults to Aldi). Group view shows estimated cost per store.
- **Pantry** — Track what you have on hand. Items stocked in the pantry are skipped when building shopping lists.
- **Price Tracking** — Scan a receipt photo with AI to log item prices by store. Compares unit prices (per oz, per fl oz) across stores and highlights the best deal.
- **Prices tab** — Browse your full price history sorted by name or savings potential.

---

## Tech Stack

| Layer | What it is |
|---|---|
| **Frontend** | Single HTML file — React 18 + JSX (transpiled by Babel standalone in-browser) |
| **Backend** | Cloudflare Pages Function (`functions/api.js`) — replaces a traditional PHP/Node server |
| **Database** | Cloudflare KV — stores all app data as a single JSON blob per user |
| **AI** | Anthropic Claude API (claude-haiku) — receipt scanning and recipe extraction, proxied server-side |
| **Hosting** | Cloudflare Pages — auto-deploys from GitHub on push |

No build step, no npm, no framework CLI. The entire frontend is one HTML file.

---

## File Structure

```
grocerycart/
  index.html          ← Entire frontend app (React, CSS, all UI)
  functions/
    api.js            ← Cloudflare Pages Function (data API + Claude proxy)
  README.md           ← This file
```

The `functions/api.js` file is automatically picked up by Cloudflare Pages and served at the `/api` route. It handles:
- `GET /api` — load all app data from KV
- `POST /api` — save all app data to KV
- `POST /api?action=claude` — proxy a request to the Anthropic API (keeps your API key off the client)

---

## How to Deploy

### 1. Fork or copy this project to a GitHub repo

The Cloudflare Pages project connects directly to GitHub and auto-deploys on every push to `main`.

### 2. Create a Cloudflare Pages project

- Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
- Select your repo
- **Root directory**: `grocerycart` (if this folder is inside a larger repo) or leave blank if it's the repo root
- **Build command**: *(leave empty)*
- **Build output directory**: *(leave empty)*
- Click **Save and Deploy**

### 3. Create a KV namespace

- Cloudflare dashboard → **Storage & Databases** → **KV** → **Create a namespace**
- Name it anything (e.g. `GROCERY_KV`)

### 4. Add bindings and secrets to the Pages project

In your Pages project → **Settings** → **Bindings**:

| Type | Variable name | Value |
|---|---|---|
| KV namespace | `GROCERY_KV` | *(select the namespace you created)* |

In your Pages project → **Settings** → **Environment variables** → add as **Secrets**:

| Variable | Value |
|---|---|
| `PW_TOKEN` | Any random string — this is your app password. Generate one with `openssl rand -hex 16` |
| `ANTHROPIC_KEY` | Your Anthropic API key (`sk-ant-...`) from console.anthropic.com |

After adding bindings/secrets, trigger a new deployment (push a commit or click Retry deployment).

### 5. Add a custom domain (optional)

Pages project → **Custom domains** → Add your subdomain (e.g. `grocery.yourdomain.com`). If the domain is already on Cloudflare, DNS is set up automatically.

---

## First-Time Setup in the App

1. Open the app URL
2. Tap the **gear icon** (top right)
3. Enter your `PW_TOKEN` value in the **Access Token** field
4. Tap **Save Settings**
5. The sync dot in the header turns **green** — you're connected

Your recipe library and pantry defaults load automatically on first connection.

---

## Using the AI Features

### Receipt Scanning (Scan tab)
- Photograph a grocery receipt
- AI extracts every item, price, and package size
- Review and correct any misreads
- Select a store and save — prices are logged to your history

### Recipe Extraction (Recipes → Add Recipe → Upload)
- Upload a photo or PDF of a recipe page (cookbook, screenshot, printout)
- AI extracts the recipe name and full ingredient list
- Review, then save to your library

### Recipe from Text (Recipes → Add Recipe → Paste & Parse)
- Copy/paste any recipe text from a website
- AI parses out the ingredients automatically

**Cost:** Claude Haiku is used for all AI calls — roughly $0.01–0.03 per receipt scan or recipe extraction.

---

## Data Storage

All data (recipes, shopping list, pantry, price history, custom stores) is stored in a single Cloudflare KV entry as JSON. The app also caches data in `localStorage` for offline use — if the server is unreachable, the app loads from cache and shows "Offline" in the header.

Data is auto-saved 1.5 seconds after any change.

---

## Customization

### Adding stores
In the Shopping List tab, tap any store badge (e.g. `ALDI ▾`) → scroll to the bottom of the picker → type a store name and tap **Add**. Custom stores are saved with your data.

### Default store
New shopping list items default to **Aldi**. If an item has price history, it auto-assigns to the cheapest store on record.

### Pantry defaults
The pantry pre-loads ~50 common staples (salt, butter, olive oil, etc.) all marked as in-stock. Toggle any item off if you've run out.
