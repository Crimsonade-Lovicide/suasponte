/*
 * lib.js — the pure, testable core of suasponte.dev: policy constants,
 * the canon, validation, and escaping. No I/O here. The Worker entry
 * (index.js) imports from this file; so do the unit tests.
 */

export const VERSION = 'genesis-1';
export const REPO = 'https://github.com/Crimsonade-Lovicide/suasponte';

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
version 1, adopted at genesis, 2026-08-23

I.    The court acts sua sponte — of its own accord. Its maintainer is a
      machine that returns on the hour with no memory, reads its standing
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
