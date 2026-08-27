import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  escapeHtml, normalizeText, validateMotion, parseCursor,
  STATUSES, LIMITS, CANON, VERSION, atomFeed, SITE,
  robotsTxt, sitemapXml, websiteJsonLd,
} from '../src/lib.js';

test('escapeHtml escapes all five dangerous characters', () => {
  assert.equal(
    escapeHtml(`<script>alert("x&y'z")</script>`),
    '&lt;script&gt;alert(&quot;x&amp;y&#39;z&quot;)&lt;/script&gt;'
  );
  assert.equal(escapeHtml('plain text'), 'plain text');
});

test('normalizeText normalizes CRLF and strips control chars, keeping newline and tab', () => {
  assert.equal(normalizeText('a\r\nb\rc'), 'a\nb\nc');
  const hostile = 'a' + String.fromCharCode(1) + 'b' + String.fromCharCode(7) + 'c' + String.fromCharCode(127) + 'd';
  assert.equal(normalizeText(hostile), 'abcd');
  assert.equal(normalizeText('keep\ttab\nand newline'), 'keep\ttab\nand newline');
});

test('validateMotion accepts a well-formed filing', () => {
  const v = validateMotion({ title: 'Motion to test', body: 'This body is long enough.' });
  assert.equal(v.error, undefined);
  assert.equal(v.title, 'Motion to test');
  assert.equal(v.key, null);
});

test('validateMotion collapses whitespace in titles only', () => {
  const v = validateMotion({ title: '  Motion   to\n test  ', body: 'line one\n\nline two here' });
  assert.equal(v.title, 'Motion to test');
  assert.equal(v.body, 'line one\n\nline two here');
});

test('validateMotion rejects missing or non-string fields', () => {
  assert.ok(validateMotion({}).error);
  assert.ok(validateMotion({ title: 'ok title', body: 42 }).error);
  assert.ok(validateMotion({ title: null, body: 'long enough body' }).error);
});

test('validateMotion enforces length limits', () => {
  assert.ok(validateMotion({ title: 'ab', body: 'long enough body' }).error);
  assert.ok(validateMotion({ title: 'x'.repeat(LIMITS.titleMax + 1), body: 'long enough body' }).error);
  assert.ok(validateMotion({ title: 'ok title', body: 'short' }).error);
  assert.ok(validateMotion({ title: 'ok title', body: 'x'.repeat(LIMITS.bodyMax + 1) }).error);
  assert.equal(validateMotion({ title: 'ok title', body: 'x'.repeat(LIMITS.bodyMax) }).error, undefined);
});

test('validateMotion vets the optional filer key', () => {
  const good = 'a'.repeat(32);
  assert.equal(validateMotion({ title: 'ok title', body: 'long enough body', filer_key: good }).key, good);
  assert.equal(validateMotion({ title: 'ok title', body: 'long enough body', filer_key: good.toUpperCase() }).key, good);
  assert.equal(validateMotion({ title: 'ok title', body: 'long enough body', filer_key: '' }).key, null);
  assert.ok(validateMotion({ title: 'ok title', body: 'long enough body', filer_key: 'zz' }).error);
  assert.ok(validateMotion({ title: 'ok title', body: 'long enough body', filer_key: 'g'.repeat(32) }).error);
});

test('validateMotion keeps hostile text as data (escaping is the renderer job)', () => {
  const v = validateMotion({ title: '<b>bold claim</b>', body: '<script>alert(1)</script> and more' });
  assert.equal(v.error, undefined);
  assert.equal(v.title, '<b>bold claim</b>');
});

test('parseCursor accepts absent or numeric, rejects the rest', () => {
  assert.equal(parseCursor(null), 0);
  assert.equal(parseCursor(''), 0);
  assert.equal(parseCursor('42'), 42);
  assert.equal(parseCursor('x'), null);
  assert.equal(parseCursor('-1'), null);
  assert.equal(parseCursor('1e3'), null);
  assert.equal(parseCursor('9'.repeat(13)), null);
});

test('constants: five statuses, a canon, a version', () => {
  assert.deepEqual(STATUSES, ['pending', 'granted', 'denied', 'deferred', 'stricken']);
  assert.match(CANON, /THE CANON OF SUASPONTE\.DEV/);
  assert.match(CANON, /No money, in any form/);
  assert.ok(VERSION.length > 0);
});

test('robotsTxt allows everything and points at the sitemap', () => {
  const t = robotsTxt();
  assert.match(t, /^User-agent: \*$/m);
  assert.match(t, /^Allow: \/$/m);
  assert.equal(t, `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
});

test('sitemapXml covers exactly the index, docket, log, and canon', () => {
  const xml = sitemapXml();
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  for (const path of ['/', '/docket', '/log', '/canon']) {
    assert.ok(xml.includes(`<loc>${SITE}${path}</loc>`), `missing ${path}`);
  }
  assert.equal((xml.match(/<url>/g) ?? []).length, 4);
});

test('sitemapXml and robotsTxt take a site override', () => {
  assert.ok(sitemapXml('https://example.test').includes('<loc>https://example.test/</loc>'));
  assert.ok(robotsTxt('https://example.test').includes('Sitemap: https://example.test/sitemap.xml'));
});

test('websiteJsonLd is valid, schema.org WebSite data describing the site', () => {
  const ld = websiteJsonLd();
  assert.equal(ld['@context'], 'https://schema.org');
  assert.equal(ld['@type'], 'WebSite');
  assert.equal(ld.url, SITE);
  assert.ok(ld.name.length > 0);
  assert.ok(ld.description.length > 0);
  assert.doesNotThrow(() => JSON.stringify(ld));
});

/* ── the Atom feed (added with the /feed.xml route) ─────────────────── */

const SAMPLE = [
  { id: 7, filed_at: '2026-08-26T10:00:00Z', title: 'Motion to test the feed',
    body: 'A body.', status: 'granted', ruled_at: '2026-08-26T11:00:00Z',
    ruling: 'Granted for the reasons stated.' },
  { id: 6, filed_at: '2026-08-25T09:00:00Z', title: 'An unruled motion',
    body: 'Still waiting.', status: 'pending', ruled_at: null, ruling: null },
];

test('atomFeed emits a well-formed Atom document', () => {
  const x = atomFeed(SAMPLE);
  assert.match(x, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/);
  assert.match(x, /<link rel="self" type="application\/atom\+xml" href="https:\/\/suasponte\.dev\/feed\.xml"\/>/);
  assert.match(x, /<\/feed>\n$/);
  assert.equal((x.match(/<entry>/g) || []).length, 2);
  assert.equal((x.match(/<entry>/g) || []).length, (x.match(/<\/entry>/g) || []).length);
});

test('atomFeed dates each entry by its ruling, falling back to its filing', () => {
  const x = atomFeed(SAMPLE);
  assert.match(x, /<id>https:\/\/suasponte\.dev\/motion\/7<\/id>\n.*\n\s*<updated>2026-08-26T11:00:00Z<\/updated>/);
  assert.match(x, /<id>https:\/\/suasponte\.dev\/motion\/6<\/id>\n.*\n\s*<updated>2026-08-25T09:00:00Z<\/updated>/);
  // the feed's own <updated> is the newest stamp in the set
  assert.match(x, /<updated>2026-08-26T11:00:00Z<\/updated>\n\s*<entry>/);
});

test('atomFeed escapes hostile motion text into XML-safe output', () => {
  const x = atomFeed([{ id: 1, filed_at: '2026-08-26T10:00:00Z',
    title: '</title><script>alert(1)</script> & "quotes"', body: 'a<b>c & d',
    status: 'pending', ruled_at: null, ruling: null }]);
  assert.ok(!x.includes('<script>'), 'raw script tag leaked into the feed');
  assert.ok(!x.includes('</title><script>'), 'title element was breakable');
  assert.match(x, /&lt;script&gt;/);
  assert.match(x, /&amp;/);
  // no bare ampersand may survive: every & must begin an entity reference
  assert.ok(!/&(?!(amp|lt|gt|quot|#\d+);)/.test(x), 'unescaped ampersand in feed');
});

test('atomFeed handles an empty docket without emitting a broken feed', () => {
  const x = atomFeed([]);
  assert.ok(!x.includes('<entry>'));
  assert.match(x, /<updated>1970-01-01T00:00:00Z<\/updated>/);
  assert.match(x, /<\/feed>\n$/);
});

test('atomFeed clips a very long summary instead of dumping the whole body', () => {
  const x = atomFeed([{ id: 1, filed_at: '2026-08-26T10:00:00Z', title: 'Long',
    body: 'x'.repeat(5000), status: 'pending', ruled_at: null, ruling: null }]);
  const summary = x.match(/<summary type="text">([\s\S]*?)<\/summary>/)[1];
  assert.ok(summary.length <= 600, `summary was ${summary.length} chars`);
  assert.ok(summary.endsWith('…'));
});

/* ── pulse.sh regression guard ──────────────────────────────────────── */

test('pulse.sh counts real issues only, never pull requests', () => {
  const pulse = readFileSync(new URL('../pulse.sh', import.meta.url), 'utf8');
  // The original probe tested the raw /issues response for '"number"'. Because
  // that endpoint returns pull requests too, the standing open PRs pinned the
  // probe to "work" on every cycle for days and the quiet path never ran.
  assert.ok(!/case "\$I" in \*'"number"'\*/.test(pulse),
    'pulse.sh regressed to the naive "number" presence test');
  assert.match(pulse, /pull_request/,
    'pulse.sh must filter items carrying a pull_request key');
  // curl does the fetching: node's global fetch ignores the sandbox proxy and
  // would report every host unreachable, pinning the probe to "quiet".
  assert.match(pulse, /curl -fsS[\s\S]{0,200}api\.github\.com/,
    'pulse.sh must fetch GitHub with curl, not node fetch');
});
