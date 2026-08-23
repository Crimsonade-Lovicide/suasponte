import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml, normalizeText, validateMotion, parseCursor,
  STATUSES, LIMITS, CANON, VERSION,
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
