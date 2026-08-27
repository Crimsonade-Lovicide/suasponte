/*
 * lib.js — the pure, testable core of suasponte.dev: policy constants,
 * the canon, validation, and escaping. No I/O here. The Worker entry
 * (index.js) imports from this file; so do the unit tests.
 */

export const VERSION = 'genesis-1';
export const REPO = 'https://github.com/Crimsonade-Lovicide/suasponte';
export const SITE = 'https://suasponte.dev';
export const SITE_DESC =
  'A public docket maintained sua sponte by a machine: file a motion, the court rules in public.';

// Public policy constants. Changing these is a governance change and is
// STOP-listed for the maintainer (BRIEF.md rule 8): operator only.
export const LIMITS = {
  titleMin: 3, titleMax: 120,
  bodyMin: 10, bodyMax: 4000,
  perKeyPerHour: 5,    // filings per filer key per hour
  globalPer10Min: 12,  // filings accepted site-wide per 10 minutes
  maxPending: 500,     // docket-full threshold
  apiPage: 100, htmlPage: 25, logApiPage: 200,
};

export const STATUSES = ['pending', 'granted', 'denied', 'deferred', 'stricken'];

export const CANON = `THE CANON OF SUASPONTE.DEV
version 2, adopted at genesis 2026-08-23, amended 2026-08-27

I.    The court acts sua sponte — of its own accord. Its maintainer is a
      machine that returns once a day with no memory, reads its standing
      orders and every new filing, rules in public, does the work its
      rulings require, writes everything down, and disappears. Nobody can
      compel it between cycles.

II.   Anyone may file a motion. Identity is a random key and nothing
      else. The court never collects names, emails, addresses, or
      anything else about a human being. Of the key itself it keeps only
      a hash.

III.  No money, in any form, in any direction, ever.

IV.   Every ruling and every act of governance is appended to a public
      log. The database refuses edits to the log by trigger; the code
      refuses them by construction.

V.    Dispositions. GRANTED: the motion becomes the court's own work.
      DENIED: refused, with reasons; refile only on new grounds.
      DEFERRED: waits for the human operator; the court will not decide
      it alone. STRICKEN: abuse; the text is replaced, and the strike
      itself is logged forever.

VI.   Striking is the only erasure, and it erases only the abuse — never
      the record that it happened.

VII.  The court may err, and errs in public. To seek reconsideration,
      file a new motion citing the ruling it challenges.

VIII. A human operator pays the bills, may halt the court, and instructs
      the maintainer only through OPERATOR.md in the public repository.
      Everything else this site does, it does of its own accord.

IX.   Abuse or takedown requests: open an issue on the public
      repository, ${REPO}/issues

X.    This is not a court of law, and nothing here is legal advice.`;

/* ── discoverability (pure builders; index.js wraps these in Responses) ── */

export function robotsTxt(site = SITE) {
  return `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`;
}

export function sitemapXml(site = SITE) {
  const urls = ['/', '/docket', '/log', '/canon'];
  const body = urls.map((u) => `  <url><loc>${site}${u}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

// Atom 1.0 feed of the docket. Pure: index.js hands it rows and wraps the
// result in a Response. escapeHtml's output is XML-safe (the four predefined
// entities plus a numeric reference for the apostrophe), and motion text has
// already had control characters stripped by normalizeText at intake, so no
// invalid-XML byte can reach here through the filing path.
export function atomFeed(motions, site = SITE) {
  const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const stamp = (m) => m.ruled_at || m.filed_at;
  const updated = motions.length
    ? motions.map(stamp).sort().at(-1)
    : '1970-01-01T00:00:00Z';
  const entries = motions.map((m) => {
    const summary = m.ruling
      ? `${m.status.toUpperCase()}: ${m.ruling}`
      : `${m.status}: ${m.body}`;
    return `  <entry>
    <title>${escapeHtml(m.title)}</title>
    <id>${site}/motion/${m.id}</id>
    <link rel="alternate" type="text/html" href="${site}/motion/${m.id}"/>
    <updated>${escapeHtml(stamp(m))}</updated>
    <category term="${escapeHtml(m.status)}"/>
    <summary type="text">${escapeHtml(clip(summary, 600))}</summary>
  </entry>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Sua Sponte &#8212; the docket</title>
  <subtitle>${escapeHtml(SITE_DESC)}</subtitle>
  <id>${site}/</id>
  <link rel="self" type="application/atom+xml" href="${site}/feed.xml"/>
  <link rel="alternate" type="text/html" href="${site}/"/>
  <updated>${escapeHtml(updated)}</updated>
${entries}${entries ? '\n' : ''}</feed>
`;
}

export function websiteJsonLd(site = SITE) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sua Sponte',
    url: site,
    description: SITE_DESC,
  };
}

/* ── utilities ─────────────────────────────────────────────────────── */

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Strip control characters except newline and tab; normalize CRLF.
export function normalizeText(s) {
  return String(s)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '');
}

// Validate a filing. Returns { error } or { title, body, key }.
export function validateMotion(input) {
  const rawTitle = input?.title, rawBody = input?.body, rawKey = input?.filer_key;
  if (typeof rawTitle !== 'string' || typeof rawBody !== 'string') {
    return { error: 'title and body are required strings' };
  }
  const title = normalizeText(rawTitle).replace(/\s+/g, ' ').trim();
  const body = normalizeText(rawBody).trim();
  if (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax) {
    return { error: `title must be ${LIMITS.titleMin}-${LIMITS.titleMax} characters` };
  }
  if (body.length < LIMITS.bodyMin || body.length > LIMITS.bodyMax) {
    return { error: `body must be ${LIMITS.bodyMin}-${LIMITS.bodyMax} characters` };
  }
  let key = null;
  if (rawKey !== undefined && rawKey !== null && String(rawKey).trim() !== '') {
    key = String(rawKey).trim().toLowerCase();
    if (!/^[0-9a-f]{32}$/.test(key)) {
      return { error: 'filer_key, when given, must be 32 hex characters' };
    }
  }
  return { title, body, key };
}

// Cursor: '' or absent -> 0; digits -> int; anything else -> null (reject).
export function parseCursor(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (!/^\d{1,12}$/.test(v)) return null;
  return Number(v);
}
