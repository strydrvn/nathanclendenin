/**
 * Nathan Clendenin Portfolio — Manifest Worker
 *
 * Bindings required:
 *   R2 Bucket binding → variable name: BUCKET
 *
 * Routes:
 *   GET /              → full site manifest
 *   GET /manifest.json → same
 *   GET /{albumId}     → image list for one album
 */

const SITE_META = {
  title: 'Nathan Clendenin',
  subtitle: 'Photojournalist · Storyteller · Entrepreneur',
  bio: 'Soli Deo Gloria.',
  social: {
    instagram: 'nathanclendenin',
    twitter:   'nathanclendenin',
    linkedin:  'nathanclendenin'
  }
};

// R2 public domain — images served from here
const R2_DOMAIN = 'https://images.nathanclendenin.com';

// Cloudflare Image Resizing helper
// Sizes served per context:
//   thumb  → album grid cards  (600w, 4:3 crop, WebP)
//   medium → lightbox preload  (1200w, WebP)
//   full   → lightbox full res (2400w, WebP)
//   hero   → homepage hero     (2560w, WebP)
function imgUrl(key, size) {
  const params = {
    thumb:  'width=600,height=450,fit=cover,quality=82,format=webp',
    medium: 'width=1200,quality=88,format=webp',
    full:   'width=2400,quality=90,format=webp',
    hero:   'width=2560,quality=90,format=webp',
  }[size] || 'width=1200,format=webp';

  return `${R2_DOMAIN}/cdn-cgi/image/${params}/${key}`;
}

const SKIP      = new Set(['hero', 'external-promo', 'assets', '_archive', '_drafts', '_covers']);
const IMAGE_RE  = /\.(jpg|jpeg|png|webp|gif|avif)$/i;
const isImage   = key => IMAGE_RE.test(key);

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Cache-Control':                'public, max-age=60',
  'Content-Type':                 'application/json',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method !== 'GET')     return json({ error: 'Method not allowed' }, 405);

    const path = decodeURIComponent(new URL(request.url).pathname.replace(/^\/|\/$/g, ''));

    try {
      if (!path || path === 'manifest.json') {
        return json(await buildManifest(env.BUCKET));
      } else if (path === 'promo') {
        return json(await buildPromo(env.BUCKET));
      } else {
        return json(await buildAlbum(env.BUCKET, path));
      }
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }
};

// ── MANIFEST ──────────────────────────────────────────────────────────
async function buildManifest(bucket) {
  const listed  = await bucket.list({ delimiter: '/' });
  const folders = (listed.delimitedPrefixes || [])
    .map(p => p.replace(/\/$/, ''))
    .filter(id => !SKIP.has(id) && !id.startsWith('_'));

  const albums = (
    await Promise.all(folders.map(id => buildAlbumCard(bucket, id)))
  ).filter(a => a.count > 0);

  albums.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));
  albums.forEach(a => delete a.order);

  const hero = await buildHero(bucket);
  return { site: SITE_META, hero, albums };
}

// ── ALBUM CARD (homepage grid) ────────────────────────────────────────
async function buildAlbumCard(bucket, albumId) {
  const { meta, objects } = await getFolderData(bucket, albumId);
  const autoTitle = albumId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Detect sub-folders → this is a collection, not a plain album
  const subListed  = await bucket.list({ prefix: `${albumId}/`, delimiter: '/' });
  const subfolders = (subListed.delimitedPrefixes || [])
    .map(p => p.replace(/\/$/, '').slice(albumId.length + 1))
    .filter(id => id && !id.startsWith('_'));

  if (subfolders.length > 0) {
    // Collection: cover = explicit cover.jpg, else first nested image
    const coverKey = findCoverKey(objects, albumId) || findNestedCoverKey(objects, albumId);
    return {
      id:          albumId,
      type:        'collection',
      title:       meta.title       || autoTitle,
      description: meta.description || '',
      year:        meta.year        || '',
      cover: coverKey ? {
        thumb:  imgUrl(coverKey, 'thumb'),
        medium: imgUrl(coverKey, 'medium'),
      } : null,
      count:       subfolders.length,  // number of sub-albums
      order:       meta.order ?? 999,
    };
  }

  // Plain album
  const coverKey = findCoverKey(objects, albumId);
  const count    = objects.filter(o => isImageInRoot(o.key, albumId)).length;

  return {
    id:          albumId,
    type:        'album',
    title:       meta.title       || autoTitle,
    description: meta.description || '',
    year:        meta.year        || '',
    location:    meta.location    || '',
    cover: coverKey ? {
      thumb:  imgUrl(coverKey, 'thumb'),
      medium: imgUrl(coverKey, 'medium'),
    } : null,
    count,
    order: meta.order ?? 999,
  };
}

// ── ALBUM or COLLECTION DETAIL ────────────────────────────────────────
async function buildAlbum(bucket, albumId) {
  // Check for sub-folders first — if found, return collection detail
  const subListed  = await bucket.list({ prefix: `${albumId}/`, delimiter: '/' });
  const subfolders = (subListed.delimitedPrefixes || [])
    .map(p => p.replace(/\/$/, '').slice(albumId.length + 1))
    .filter(id => id && !id.startsWith('_'));

  if (subfolders.length > 0) {
    return buildCollectionDetail(bucket, albumId, subfolders);
  }

  // ── Plain album ──────────────────────────────────────────────────
  const { meta, objects } = await getFolderData(bucket, albumId);
  const autoTitle = albumId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Load exif.json if present
  const exifMap = await loadExif(bucket, albumId, objects);

  // All images sorted numerically, cover first
  const coverKey = findCoverKey(objects, albumId);
  const rest     = objects
    .filter(o => isImageInRoot(o.key, albumId) && o.key !== coverKey)
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));

  const allKeys = coverKey
    ? [{ key: coverKey, iscover: true }, ...rest.map(o => ({ key: o.key, iscover: false }))]
    : rest.map(o => ({ key: o.key, iscover: false }));

  const images = allKeys.map(({ key, iscover }) => {
    const file    = key.slice(albumId.length + 1);
    const exif    = exifMap[file] || {};
    const caption = exif.caption || (iscover && meta.coverCaption ? meta.coverCaption : '');

    return {
      file,
      caption,
      portrait: false,
      ...(exif.camera    && { camera:   exif.camera }),
      ...(exif.lens      && { lens:     exif.lens }),
      ...(exif.aperture  && { aperture: exif.aperture }),
      ...(exif.shutter   && { shutter:  exif.shutter }),
      ...(exif.iso       && { iso:      exif.iso }),
      ...(exif.focal     && { focal:    exif.focal }),
      ...(exif.date      && { date:     exif.date }),
      urls: {
        thumb:  imgUrl(key, 'thumb'),
        medium: imgUrl(key, 'medium'),
        full:   imgUrl(key, 'full'),
      }
    };
  });

  // If nested inside a collection, include parent id for the back button
  const parentId = albumId.includes('/')
    ? albumId.split('/').slice(0, -1).join('/')
    : null;

  return {
    title:       meta.title       || autoTitle,
    description: meta.description || '',
    year:        meta.year        || '',
    location:    meta.location    || '',
    ...(parentId && { parent: parentId }),
    images,
  };
}

// ── COLLECTION DETAIL (collection.html) ──────────────────────────────
async function buildCollectionDetail(bucket, collectionId, subfolderIds) {
  const { meta } = await getFolderData(bucket, collectionId);
  const autoTitle = collectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const albums = (await Promise.all(
    subfolderIds.map(id => buildAlbumCard(bucket, `${collectionId}/${id}`))
  )).filter(a => a.count > 0);

  albums.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));
  albums.forEach(a => delete a.order);

  return {
    title:       meta.title       || autoTitle,
    description: meta.description || '',
    year:        meta.year        || '',
    albums,
  };
}

// Load exif.json from R2 — returns {} if not present
async function loadExif(bucket, albumId, objects) {
  const exifKey = `${albumId}/exif.json`;
  if (!objects.find(o => o.key === exifKey)) return {};
  const obj = await bucket.get(exifKey);
  if (!obj) return {};
  try { return await obj.json(); } catch { return {}; }
}

// ── PROMO (external-promo folder) ────────────────────────────────────
async function buildPromo(bucket) {
  const listed  = await bucket.list({ prefix: 'external-promo/', delimiter: '/' });
  const folders = (listed.delimitedPrefixes || [])
    .map(p => p.replace(/^external-promo\//, '').replace(/\/$/, ''))
    .filter(id => id);

  const items = await Promise.all(folders.map(async id => {
    const fullId = `external-promo/${id}`;
    const { meta, objects } = await getFolderData(bucket, fullId);
    const autoTitle = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const coverKey  = findCoverKey(objects, fullId);

    return {
      id,
      title:       meta.title       || autoTitle,
      description: meta.description || '',
      url:         meta.url         || '',
      year:        meta.year        || '',
      cover: coverKey ? {
        thumb:  imgUrl(coverKey, 'thumb'),
        medium: imgUrl(coverKey, 'medium'),
      } : null,
      order: meta.order ?? 999,
    };
  }));

  items.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title));
  items.forEach(a => delete a.order);

  return { items };
}

// ── HERO ──────────────────────────────────────────────────────────────
async function buildHero(bucket) {
  let heroMeta = {};
  const mObj = await bucket.get('hero/meta.json');
  if (mObj) { try { heroMeta = await mObj.json(); } catch {} }

  const listed = await bucket.list({ prefix: 'hero/' });
  let keys = listed.objects
    .filter(o => isImage(o.key) && !o.key.endsWith('/'))
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))
    .map(o => o.key);

  // If a specific imageKey is set, put it first
  if (heroMeta.imageKey) {
    const pinned = `hero/${heroMeta.imageKey}`;
    keys = [pinned, ...keys.filter(k => k !== pinned)];
  }

  if (!keys.length) return { url: null, caption: '', slides: [] };

  const slides = keys.map((key, i) => ({
    url:     imgUrl(key, 'hero'),
    caption: i === 0 ? (heroMeta.caption || '') : '',
  }));

  return {
    url:     slides[0].url,      // backward compat
    caption: slides[0].caption,  // backward compat
    slides,
  };
}

// ── HELPERS ───────────────────────────────────────────────────────────
async function getFolderData(bucket, albumId) {
  const listed  = await bucket.list({ prefix: `${albumId}/`, limit: 1000 });
  const objects = listed.objects;

  let meta = {};
  const metaKey = `${albumId}/meta.json`;
  if (objects.find(o => o.key === metaKey)) {
    const fetched = await bucket.get(metaKey);
    if (fetched) { try { meta = await fetched.json(); } catch {} }
  }

  return { meta, objects };
}

function isImageInRoot(key, albumId) {
  const rel = key.slice(albumId.length + 1);
  return isImage(rel) && !rel.includes('/');
}

function findCoverKey(objects, albumId) {
  const cover = objects.find(o => /\/cover\.(jpg|jpeg|png|webp)$/i.test(o.key));
  if (cover) return cover.key;

  const first = objects
    .filter(o => isImageInRoot(o.key, albumId))
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))[0];

  return first ? first.key : null;
}

// For collections: fall back to the first image anywhere in any sub-folder
function findNestedCoverKey(objects, albumId) {
  const first = objects
    .filter(o => {
      const rel = o.key.slice(albumId.length + 1);
      return isImage(rel) && !rel.startsWith('_');
    })
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }))[0];
  return first ? first.key : null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: CORS });
}
