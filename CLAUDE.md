# nathanclendenin.com — Project Memory

## What this is
Personal photography portfolio. Dark editorial design with light mode support via `prefers-color-scheme`.

## Stack
- **Cloudflare Pages** → serves HTML files, connected to GitHub (auto-deploys on push)
- **Cloudflare Worker** (`nc-manifest`) → reads R2 bucket, returns album/image manifests as JSON
- **Cloudflare R2** (`nclendenin-photos`) → stores all images
- **Cloudflare Image Resizing** → enabled on zone; Worker generates sized URLs

## URLs
- Live site: `https://nathanclendenin.com` (custom domain on Cloudflare Pages)
- Pages preview: `https://nathanclendenin.pages.dev`
- Worker: `https://nc-manifest.nathan-48c.workers.dev`
- Custom Worker domain: `api.nathanclendenin.com` (already set up)
- GitHub: `git@github.com:strydrvn/nathanclendenin.git`

## Files
| File | Purpose |
|---|---|
| `index.html` | Homepage — hero + album grid |
| `album.html` | Album page — photo grid + lightbox |
| `collection.html` | Collection page — nested album groups |
| `meta-builder.html` | Local tool — generates `meta.json` for R2 folders |
| `worker.js` | Cloudflare Worker — reads R2, returns manifest JSON |
| `wrangler.toml` | Worker deploy config (name: nc-manifest, R2 binding: BUCKET) |
| `exif-scan.js` | NOT YET CREATED — Node.js script to read EXIF from photos, write `exif.json` |

## Deployment workflow
`git push` → Cloudflare Pages auto-deploys. No manual uploads needed.
Worker deploys separately via `wrangler` (or can be wired to CI later).

## R2 bucket structure
```
nathanclendenin-photos/
  hero/
    hero.jpg
    meta.json         ← optional: imageKey, caption
  [album-name]/
    cover.jpg         ← optional, else first image alphabetically
    meta.json         ← optional: title, year, description, location, order
    exif.json         ← NOT YET IN USE — waiting on captions in images
    001.jpg, 002.jpg ...
  travel/             ← collection (folder of folders)
    north-carolina/
      001.jpg ...
```

## What's done
- [x] GitHub repo created and connected to Cloudflare Pages
- [x] `wrangler.toml` added for Worker deploys
- [x] `nathanclendenin.com` custom domain active on new Pages project
- [x] Old manual Pages project can be deleted (new one is live)
- [x] Light mode album title color fixed on `collection.html`

## What's next
- [ ] `exif-scan.js` — build Node.js script to read EXIF/IPTC from photos and write `exif.json` per album (waiting until captions are added to images in Lightroom)
- [ ] Wire Worker deploy to GitHub Actions (optional — currently manual via wrangler)
