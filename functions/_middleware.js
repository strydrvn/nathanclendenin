// Rewrites OG/Twitter preview meta tags for deep-linked photos
// (?album=<id>&photo=N) so shared links preview that specific photo.
// Scrapers (iMessage, Slack, Facebook, X) don't run JS, so this has
// to happen server-side, before the HTML reaches them.

const API = 'https://api.nathanclendenin.com';
const GALLERY_FALLBACK_TITLE = 'Album';

// Turn any existing transform URL (…/cdn-cgi/image/<params>/<key>) into a
// 1200px-wide JPEG. Scrapers won't render WebP.
function toOgImage(transformUrl) {
  return transformUrl.replace(
    /\/cdn-cgi\/image\/[^/]+\//,
    '/cdn-cgi/image/width=1200,quality=85,format=jpeg/'
  );
}

export async function onRequest(context) {
  const { request, next } = context;
  const url      = new URL(request.url);
  const albumId  = url.searchParams.get('album');
  const photo    = parseInt(url.searchParams.get('photo'), 10);
  const isAlbumPhoto =
    (url.pathname === '/album' || url.pathname === '/album.html') && albumId && photo >= 1;

  if (!isAlbumPhoto) return next();

  // Cloudflare Pages 308-redirects /album.html → /album (clean URLs).
  // Fetch the clean path directly so the rewrite lands on a 200 —
  // scrapers won't follow a redirect to read meta tags.
  let assetRequest = request;
  if (url.pathname === '/album.html') {
    const cleanUrl = new URL(url);
    cleanUrl.pathname = '/album';
    assetRequest = new Request(cleanUrl, request);
  }

  const response = await next(assetRequest);

  let ogImage = null, count = 0, title = GALLERY_FALLBACK_TITLE;
  try {
    const apiPath = albumId.split('/').map(encodeURIComponent).join('/');
    const res = await fetch(`${API}/${apiPath}`);
    if (res.ok) {
      const data = await res.json();
      title = data.title || title;
      count = data.images ? data.images.length : 0;
      const img = data.images && data.images[photo - 1];
      if (img && img.urls) ogImage = toOgImage(img.urls.medium || img.urls.full);
    }
  } catch (e) { /* fall back to default preview */ }

  if (!ogImage) return response;

  const shareTitle = `${title} — Photo ${photo}${count ? ` of ${count}` : ''}`;

  return new HTMLRewriter()
    .on('meta[property="og:image"]',        new AttrSetter('content', ogImage))
    .on('meta[name="twitter:image"]',       new AttrSetter('content', ogImage))
    .on('meta[property="og:image:alt"]',    new AttrSetter('content', shareTitle))
    .on('meta[property="og:image:width"]',  new Remover())
    .on('meta[property="og:image:height"]', new Remover())
    .on('meta[property="og:title"]',        new AttrSetter('content', shareTitle))
    .on('meta[name="twitter:title"]',       new AttrSetter('content', shareTitle))
    .on('meta[property="og:url"]',          new AttrSetter('content', url.toString()))
    .transform(response);
}

class AttrSetter {
  constructor(attr, value) { this.attr = attr; this.value = value; }
  element(el) { el.setAttribute(this.attr, this.value); }
}
class Remover { element(el) { el.remove(); } }
