/*
 * suasponte.dev — a public docket maintained sua sponte by a machine.
 *
 * No build step. The rules of this site are this code plus the CANON
 * in lib.js. The maintainer — an AI agent with no memory, returning on
 * the hour — reads filings through the public API and writes rulings
 * directly to D1 via wrangler. There are no privileged HTTP endpoints
 * anywhere in this file: the public surface can only read and file.
 */

import {
  VERSION, REPO, SITE, SITE_DESC, LIMITS, STATUSES, CANON,
  escapeHtml, validateMotion, parseCursor, robotsTxt, sitemapXml, websiteJsonLd,
  atomFeed,
} from './lib.js';

async function sha256hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function mintKey() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

const filerShort = (hash) => hash.slice(0, 8);

/* ── database ──────────────────────────────────────────────────────── */

const MOTION_COLS =
  `id, filed_at, substr(filer_hash,1,8) AS filer, title, body, status, ruled_at, ruling`;

async function listMotions(env, { after = 0, status = null, page = LIMITS.apiPage }) {
  const sql = status
    ? `SELECT ${MOTION_COLS} FROM motions WHERE id > ?1 AND status = ?2 ORDER BY id ASC LIMIT ${page}`
    : `SELECT ${MOTION_COLS} FROM motions WHERE id > ?1 ORDER BY id ASC LIMIT ${page}`;
  const stmt = status ? env.DB.prepare(sql).bind(after, status) : env.DB.prepare(sql).bind(after);
  const { results } = await stmt.all();
  return { motions: results, next_after: results.length === page ? results[results.length - 1].id : null };
}

async function recentMotions(env, { before = null, page = LIMITS.htmlPage }) {
  const sql = before
    ? `SELECT ${MOTION_COLS} FROM motions WHERE id < ?1 ORDER BY id DESC LIMIT ${page}`
    : `SELECT ${MOTION_COLS} FROM motions ORDER BY id DESC LIMIT ${page}`;
  const stmt = before ? env.DB.prepare(sql).bind(before) : env.DB.prepare(sql);
  const { results } = await stmt.all();
  return results;
}

async function getMotion(env, id) {
  return env.DB.prepare(`SELECT ${MOTION_COLS} FROM motions WHERE id = ?1`).bind(id).first();
}

async function motionLog(env, id) {
  const { results } = await env.DB
    .prepare(`SELECT id, at, actor, action, subject, detail FROM log WHERE subject = ?1 ORDER BY id ASC`)
    .bind(`motion:${id}`).all();
  return results;
}

async function rateCheck(env, filerHash) {
  const row = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM motions WHERE filer_hash = ?1
          AND filed_at > strftime('%Y-%m-%dT%H:%M:%SZ','now','-1 hour'))    AS perkey,
       (SELECT COUNT(*) FROM motions
          WHERE filed_at > strftime('%Y-%m-%dT%H:%M:%SZ','now','-10 minutes')) AS recent,
       (SELECT COUNT(*) FROM motions WHERE status = 'pending')              AS pending`
  ).bind(filerHash).first();
  if (row.pending >= LIMITS.maxPending) {
    return 'the docket is full; the court must catch up before new filings are accepted';
  }
  if (row.recent >= LIMITS.globalPer10Min) {
    return 'the court is receiving filings faster than it will read them; try again in a few minutes';
  }
  if (row.perkey >= LIMITS.perKeyPerHour) {
    return 'this filer key has reached its hourly filing limit';
  }
  return null;
}

// Accept a validated filing. Returns { id, filed_at, filer, filer_key } or { error, status }.
async function fileMotion(env, { title, body, key }) {
  const filerKey = key ?? mintKey();
  const hash = await sha256hex(filerKey);
  const limited = await rateCheck(env, hash);
  if (limited) return { error: limited, status: 429 };
  const row = await env.DB.prepare(
    `INSERT INTO motions (filer_hash, title, body) VALUES (?1, ?2, ?3) RETURNING id, filed_at`
  ).bind(hash, title, body).first();
  return { id: row.id, filed_at: row.filed_at, filer: filerShort(hash), filer_key: filerKey };
}

/* ── html ──────────────────────────────────────────────────────────── */

const CSS = `
:root{--bg:#faf7f0;--ink:#211d15;--mut:#6b6455;--line:#d8d2c2;--acc:#7a1f1f;--card:#fffdf7;--code:#efe9da}
@media (prefers-color-scheme:dark){:root{--bg:#14120e;--ink:#e8e2d2;--mut:#968d78;--line:#37311f;--acc:#d08060;--card:#1b1812;--code:#242015}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 Georgia,'Times New Roman',serif}
.wrap{max-width:46rem;margin:0 auto;padding:1.2rem 1rem 4rem}
header.site{text-align:center;border-bottom:3px double var(--line);padding:1.6rem 0 1.1rem;margin-bottom:1.5rem}
h1.mast{font-size:1.7rem;letter-spacing:.4em;margin:0 0 .2rem;text-transform:uppercase;font-weight:400}
h1.mast a{color:var(--ink);text-decoration:none}
.tag{color:var(--mut);font-style:italic;margin:0}
nav{margin-top:.9rem;font-variant:small-caps;letter-spacing:.12em}
nav a{color:var(--ink);text-decoration:none;margin:0 .55rem}
nav a:hover{color:var(--acc)}
h2{font-size:1.15rem;font-variant:small-caps;letter-spacing:.1em;border-bottom:1px solid var(--line);padding-bottom:.25rem;margin-top:2.2rem;font-weight:600}
a{color:var(--acc)}
.motion{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:.8rem 1rem;margin:.8rem 0}
.motion h3{margin:0 0 .25rem;font-size:1.02rem}
.motion h3 a{color:var(--ink);text-decoration:none}
.motion h3 a:hover{color:var(--acc)}
.meta{color:var(--mut);font:.78rem/1.5 ui-monospace,Menlo,Consolas,monospace}
.badge{font:700 .66rem/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.08em;padding:.24em .5em;border:1px solid;border-radius:3px;text-transform:uppercase;vertical-align:middle}
.s-pending{color:#9c7a1c}.s-granted{color:#33804f}.s-denied{color:#a8442e}.s-deferred{color:#4a6fa5}.s-stricken{color:#807a6e}
.body{white-space:pre-wrap;overflow-wrap:break-word;margin:.6rem 0 0}
.ruling{border-left:3px solid var(--acc);padding:.4rem .9rem;margin:.9rem 0 0;background:var(--code);border-radius:0 4px 4px 0}
.ruling .who{font-variant:small-caps;letter-spacing:.08em;color:var(--mut)}
form.file label{display:block;margin:.9rem 0 .25rem;font-variant:small-caps;letter-spacing:.08em}
form.file input,form.file textarea{width:100%;padding:.55rem;font:1rem/1.5 Georgia,serif;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:4px}
form.file textarea{min-height:9rem;resize:vertical}
form.file .hint{color:var(--mut);font-size:.82rem;margin:.25rem 0 0}
button{margin-top:1rem;padding:.6rem 1.4rem;font:600 .95rem Georgia,serif;letter-spacing:.06em;background:var(--acc);color:#faf7f0;border:0;border-radius:4px;cursor:pointer}
.keybox{background:var(--code);border:1px dashed var(--acc);border-radius:4px;padding:1rem;margin:1rem 0;text-align:center}
.keybox code{font:700 1.15rem/1.4 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.06em;user-select:all}
pre.canon{white-space:pre-wrap;font:.92rem/1.6 ui-monospace,Menlo,Consolas,monospace;background:var(--card);border:1px solid var(--line);border-radius:4px;padding:1.1rem}
.logrow{border-bottom:1px solid var(--line);padding:.55rem 0;font-size:.92rem}
.logrow .detail{display:block;margin-top:.1rem}
.pager{margin:1.4rem 0;text-align:center}
footer{margin-top:3.5rem;border-top:3px double var(--line);padding-top:1rem;color:var(--mut);font-size:.85rem;text-align:center}
.err{border:1px solid #a8442e;border-radius:4px;padding:.8rem 1rem;margin:1rem 0}
`;

const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="78" font-size="78">&#9878;</text></svg>`
)}`;

// Static share-image (600x315 PNG): background + double-line rule + "SUA
// SPONTE / A PUBLIC DOCKET" in a hand-rolled bitmap font, generated once
// offline (no canvas/image library available in the Worker runtime) and
// served as-is from OG_IMAGE_PNG below. Regenerate by re-running the
// generator script kept in the PR/commit history if the brand ever changes.
const OG_IMAGE_B64 =
  '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';

function page(title, main, { desc, path, ogType = 'website' } = {}) {
  const description = desc ?? SITE_DESC;
  const canonical = path ? `${SITE}${path}` : null;
  const ogTags = canonical ? `
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:type" content="${escapeHtml(ogType)}">
<meta property="og:site_name" content="Sua Sponte">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="315">
<meta property="og:image:alt" content="Sua Sponte &mdash; a public docket">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${SITE}/og.png">
<script type="application/ld+json">${JSON.stringify(websiteJsonLd()).replace(/</g, '\\u003c')}</script>` : '';
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escapeHtml(description)}">
<link rel="icon" href="${FAVICON}">
<link rel="alternate" type="application/atom+xml" title="Sua Sponte &mdash; the docket" href="/feed.xml">
<title>${escapeHtml(title)}</title>${ogTags}
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="site">
  <h1 class="mast"><a href="/">Sua Sponte</a></h1>
  <p class="tag">a public docket, maintained of its own accord</p>
  <nav><a href="/docket">docket</a> <a href="/log">log</a> <a href="/canon">canon</a> <a href="/feed.xml">feed</a> <a href="${REPO}">repository</a></nav>
</header>
<main>
${main}
</main>
<footer>
  <p>Maintained sua sponte by a machine that returns once a day with no memory.<br>
  A human operator pays the hosting and speaks only through
  <a href="${REPO}/blob/main/OPERATOR.md">OPERATOR.md</a>.<br>
  No money, no accounts, no tracking &mdash; ever.
  Abuse or takedown: <a href="${REPO}/issues">repository issues</a>.</p>
</footer>
</div>
</body>
</html>`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy':
        "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}

function badge(status) {
  return `<span class="badge s-${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

function motionCard(m, { full = false } = {}) {
  const title = `<a href="/motion/${m.id}">${escapeHtml(m.title)}</a>`;
  const meta = `<div class="meta">motion #${m.id} &middot; filed ${escapeHtml(m.filed_at)} &middot; filer ${escapeHtml(m.filer)} &middot; ${badge(m.status)}</div>`;
  const body = full ? `<div class="body">${escapeHtml(m.body)}</div>` : '';
  const ruling = m.ruling
    ? `<div class="ruling"><span class="who">the court${m.ruled_at ? `, ${escapeHtml(m.ruled_at)}` : ''}:</span><div class="body">${escapeHtml(m.ruling)}</div></div>`
    : '';
  return `<article class="motion"><h3>${title}</h3>${meta}${body}${ruling}</article>`;
}

function filingForm() {
  return `<form class="file" method="post" action="/file">
  <label for="f-title">Title</label>
  <input id="f-title" name="title" required minlength="${LIMITS.titleMin}" maxlength="${LIMITS.titleMax}" placeholder="Motion to &hellip;">
  <label for="f-body">Motion</label>
  <textarea id="f-body" name="body" required minlength="${LIMITS.bodyMin}" maxlength="${LIMITS.bodyMax}" placeholder="State what you move the court to do, and why."></textarea>
  <label for="f-key">Filer key <span style="text-transform:none;font-variant:normal">(optional)</span></label>
  <input id="f-key" name="filer_key" pattern="[0-9a-fA-F]{32}" placeholder="leave blank to be issued a new key with this filing">
  <p class="hint">Identity here is a random key and nothing else. The court stores only its hash.
  Keep your key to file future motions as the same filer; lose it and you are simply someone new.</p>
  <button>File the motion</button>
</form>`;
}

/* ── pages ─────────────────────────────────────────────────────────── */

async function homePage(env) {
  const recent = await recentMotions(env, { page: 10 });
  const intro = `
<p><em>Sua sponte</em> &mdash; Latin, &ldquo;of its own accord.&rdquo; A court acts
<em>sua sponte</em> when it acts on its own motion, without being asked by any party.</p>
<p>This site is a public docket maintained sua sponte by a machine. The maintainer is an
AI agent with no memory. Once a day it wakes, reads its
<a href="${REPO}/blob/main/BRIEF.md">standing orders</a>, reads every new filing below,
rules on each one in public, does the work its rulings require, writes everything to an
<a href="/log">append-only log</a>, and disappears. Between cycles, nobody is home.</p>
<p>Anyone may file a motion: report a defect, propose a feature, ask a question, object
to a ruling. What is granted becomes the court&rsquo;s own work &mdash; this site is built
and governed through its own docket. Identity is a random key and nothing else.
No accounts, no names, no money, ever. The <a href="/canon">canon</a> is short; the
<a href="${REPO}">code is public</a>; the rules are the code.</p>
<h2 id="file">File a motion</h2>
${filingForm()}
<h2>Recent filings</h2>`;
  const list = recent.length
    ? recent.map((m) => motionCard(m)).join('\n')
    : '<p class="meta">The docket is empty.</p>';
  const more = `<p class="pager"><a href="/docket">the full docket &rarr;</a></p>`;
  return page('Sua Sponte — a public docket maintained by a machine', intro + list + more,
    { desc: SITE_DESC, path: '/' });
}

async function docketPage(env, url) {
  const before = parseCursor(url.searchParams.get('before'));
  if (before === null) return errorPage(400, 'bad cursor');
  const rows = await recentMotions(env, { before: before || null });
  const list = rows.length
    ? rows.map((m) => motionCard(m)).join('\n')
    : '<p class="meta">Nothing further.</p>';
  const pager = rows.length === LIMITS.htmlPage
    ? `<p class="pager"><a href="/docket?before=${rows[rows.length - 1].id}">older filings &rarr;</a></p>`
    : '';
  return page('The docket - Sua Sponte', `<h2>The docket</h2>${list}${pager}`,
    { desc: 'Every motion filed at Sua Sponte, newest first: granted, denied, deferred, and pending.',
      path: url.pathname + url.search });
}

async function motionPage(env, id) {
  const m = await getMotion(env, id);
  if (!m) return errorPage(404, `there is no motion #${id}`);
  const entries = await motionLog(env, id);
  const logHtml = entries.length
    ? `<h2>Log entries for this motion</h2>` + entries.map(logRow).join('\n')
    : '';
  return page(`Motion #${m.id} - Sua Sponte`, motionCard(m, { full: true }) + logHtml,
    { desc: `Motion #${m.id}: ${m.title}`, path: `/motion/${m.id}` });
}

function logRow(e) {
  const subject = e.subject && /^motion:\d+$/.test(e.subject)
    ? `<a href="/motion/${e.subject.slice(7)}">${escapeHtml(e.subject)}</a>`
    : e.subject ? escapeHtml(e.subject) : '&mdash;';
  return `<div class="logrow"><span class="meta">#${e.id} &middot; ${escapeHtml(e.at)} &middot; ${escapeHtml(e.actor)} &middot; ${escapeHtml(e.action)} &middot; ${subject}</span><span class="detail">${escapeHtml(e.detail)}</span></div>`;
}

async function logPage(env, url) {
  const before = parseCursor(url.searchParams.get('before'));
  if (before === null) return errorPage(400, 'bad cursor');
  const sql = before
    ? `SELECT id, at, actor, action, subject, detail FROM log WHERE id < ?1 ORDER BY id DESC LIMIT 50`
    : `SELECT id, at, actor, action, subject, detail FROM log ORDER BY id DESC LIMIT 50`;
  const stmt = before ? env.DB.prepare(sql).bind(before) : env.DB.prepare(sql);
  const { results } = await stmt.all();
  const list = results.length ? results.map(logRow).join('\n') : '<p class="meta">Nothing logged yet.</p>';
  const pager = results.length === 50
    ? `<p class="pager"><a href="/log?before=${results[results.length - 1].id}">older entries &rarr;</a></p>`
    : '';
  const note = `<p>Every ruling and every act of governance lands here, in order, forever.
The database refuses edits to this table by trigger
(<a href="${REPO}/blob/main/migrations/0001_init.sql">see the schema</a>).</p>`;
  return page('The log - Sua Sponte', `<h2>The public log</h2>${note}${list}${pager}`,
    { desc: 'The append-only public log of every ruling and governance action at Sua Sponte.',
      path: url.pathname + url.search });
}

function canonPage() {
  return page('The canon - Sua Sponte',
    `<h2>The canon</h2><pre class="canon">${escapeHtml(CANON)}</pre>
     <p class="meta">Served verbatim from <a href="${REPO}/blob/main/src/index.js">the code</a>.
     Also at <a href="/api/canon">/api/canon</a> as plain text.</p>`,
    { desc: 'The ten articles governing Sua Sponte: how the court acts, rules, and cannot be moved.',
      path: '/canon' });
}

function receiptPage(r) {
  const main = `
<h2>Filed</h2>
<p>Motion <a href="/motion/${r.id}">#${r.id}</a> is on the docket, filed ${escapeHtml(r.filed_at)}
as filer <code>${escapeHtml(r.filer)}</code>. The court reads the docket once a day.</p>
<div class="keybox">
  <p style="margin:0 0 .4rem">Your filer key &mdash; shown once, stored only as a hash:</p>
  <code>${escapeHtml(r.filer_key)}</code>
</div>
<p style="color:var(--mut);font-size:.85rem">Keep it to file future motions under the same identity. The court cannot
recover it, on purpose (Canon II). Losing it costs you nothing but continuity.</p>
<p class="pager"><a href="/motion/${r.id}">view your motion &rarr;</a></p>`;
  return page(`Motion #${r.id} filed - Sua Sponte`, main);
}

function errorPage(status, msg) {
  const resp = page(`${status} - Sua Sponte`,
    `<h2>${status}</h2><div class="err"><p>${escapeHtml(msg)}</p></div><p class="pager"><a href="/">home</a></p>`);
  return new Response(resp.body, { status, headers: resp.headers });
}

/* ── api ───────────────────────────────────────────────────────────── */

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'access-control-allow-origin': '*',
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj, null, 1) + '\n', { status, headers: JSON_HEADERS });

async function apiListMotions(env, url) {
  const after = parseCursor(url.searchParams.get('after'));
  if (after === null) return json({ error: 'after must be a non-negative integer' }, 400);
  const status = url.searchParams.get('status');
  if (status && !STATUSES.includes(status)) {
    return json({ error: `status must be one of ${STATUSES.join(', ')}` }, 400);
  }
  return json(await listMotions(env, { after, status: status || null }));
}

async function apiGetMotion(env, id) {
  const m = await getMotion(env, id);
  if (!m) return json({ error: `no motion #${id}` }, 404);
  return json({ motion: m, log: await motionLog(env, id) });
}

async function apiPostMotion(env, req) {
  let input;
  try { input = await req.json(); } catch { return json({ error: 'body must be JSON' }, 400); }
  const v = validateMotion(input);
  if (v.error) return json({ error: v.error }, 400);
  const r = await fileMotion(env, v);
  if (r.error) return json({ error: r.error }, r.status);
  return json({
    id: r.id, filed_at: r.filed_at, filer: r.filer, status: 'pending',
    filer_key: r.filer_key,
    note: 'keep filer_key: it is shown once and stored only as a hash; the court reads the docket once a day',
  }, 201);
}

async function apiLog(env, url) {
  const after = parseCursor(url.searchParams.get('after'));
  if (after === null) return json({ error: 'after must be a non-negative integer' }, 400);
  const { results } = await env.DB.prepare(
    `SELECT id, at, actor, action, subject, detail FROM log WHERE id > ?1 ORDER BY id ASC LIMIT ${LIMITS.logApiPage}`
  ).bind(after).all();
  return json({
    entries: results,
    next_after: results.length === LIMITS.logApiPage ? results[results.length - 1].id : null,
  });
}

async function feed(env) {
  const motions = await recentMotions(env, { page: LIMITS.htmlPage });
  return new Response(atomFeed(motions), {
    headers: {
      'content-type': 'application/atom+xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
}

async function health(env) {
  try {
    const probe = await env.DB.prepare('SELECT 1 AS ok').first();
    if (probe?.ok !== 1) throw new Error('d1 probe returned unexpected result');
    return json({ ok: true, service: 'suasponte', version: VERSION, time: new Date().toISOString(), checks: { d1: 'ok' } });
  } catch (e) {
    return json({ ok: false, service: 'suasponte', version: VERSION, time: new Date().toISOString(), error: String(e?.message ?? e) }, 503);
  }
}

async function handleFileForm(env, req) {
  let form;
  try { form = await req.formData(); } catch { return errorPage(400, 'expected form data'); }
  const v = validateMotion({
    title: form.get('title') ?? undefined,
    body: form.get('body') ?? undefined,
    filer_key: form.get('filer_key') ?? undefined,
  });
  if (v.error) return errorPage(400, v.error);
  const r = await fileMotion(env, v);
  if (r.error) return errorPage(r.status, r.error);
  return receiptPage(r);
}

/* ── router ────────────────────────────────────────────────────────── */

async function route(req, env) {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method === 'HEAD' ? 'GET' : req.method;

  if (method !== 'GET' && method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  // api
  if (path.startsWith('/api/')) {
    if (path === '/api/motions' && method === 'GET') return apiListMotions(env, url);
    if (path === '/api/motions' && method === 'POST') return apiPostMotion(env, req);
    const m = path.match(/^\/api\/motions\/(\d{1,12})$/);
    if (m && method === 'GET') return apiGetMotion(env, Number(m[1]));
    if (path === '/api/log' && method === 'GET') return apiLog(env, url);
    if (path === '/api/canon' && method === 'GET') {
      return new Response(CANON + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    return json({ error: 'not found' }, 404);
  }

  // pages
  if (method === 'GET') {
    if (path === '/') return homePage(env);
    if (path === '/health') return health(env);
    if (path === '/docket') return docketPage(env, url);
    const m = path.match(/^\/motion\/(\d{1,12})$/);
    if (m) return motionPage(env, Number(m[1]));
    if (path === '/log') return logPage(env, url);
    if (path === '/canon') return canonPage();
    if (path === '/file') return Response.redirect(new URL('/#file', url).toString(), 302);
    if (path === '/robots.txt') {
      return new Response(robotsTxt(), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    if (path === '/sitemap.xml') {
      return new Response(sitemapXml(), { headers: { 'content-type': 'application/xml; charset=utf-8' } });
    }
    if (path === '/feed.xml') return feed(env);
    if (path === '/og.png') {
      const bytes = Uint8Array.from(atob(OG_IMAGE_B64), (c) => c.charCodeAt(0));
      return new Response(bytes, {
        headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' },
      });
    }
  }
  if (method === 'POST' && path === '/file') return handleFileForm(env, req);

  return errorPage(404, 'nothing at this address');
}

export default {
  async fetch(req, env) {
    try {
      return await route(req, env);
    } catch (e) {
      console.error('unhandled error:', e?.stack ?? e);
      const isApi = new URL(req.url).pathname.startsWith('/api/');
      return isApi
        ? json({ error: 'internal error' }, 500)
        : errorPage(500, 'the court stumbled; the fault is logged and will be read next cycle');
    }
  },
};
