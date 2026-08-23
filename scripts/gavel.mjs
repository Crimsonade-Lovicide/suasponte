#!/usr/bin/env node
/*
 * gavel.mjs — the maintainer's hand.
 *
 * Reads the docket over the public API; writes rulings and log entries
 * to D1 through wrangler (the only privileged path — there is none over
 * HTTP). Every write here also appends to the public log (Canon IV).
 *
 * usage:
 *   node scripts/gavel.mjs queue
 *       print every pending motion, one JSON line each, paged to exhaustion
 *   node scripts/gavel.mjs rule <id> granted|denied|deferred <ruling text...>
 *   node scripts/gavel.mjs strike <id> <reason...>
 *       replaces the motion text (the only erasure — Canon VI) and logs it
 *   node scripts/gavel.mjs log <action> <subject|-> <detail...>
 *       bare public log entry, e.g.: log deploy - "genesis deploy, health 200"
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SITE = process.env.SUASPONTE_SITE || 'https://suasponte.dev';
const DB = 'suasponte';

const die = (msg) => { console.error(`gavel: ${msg}`); process.exit(1); };
const sq = (s) => `'${String(s).replaceAll("'", "''")}'`;
const NOW = `strftime('%Y-%m-%dT%H:%M:%SZ','now')`;

function d1File(sql) {
  const f = join(tmpdir(), `gavel-${process.pid}-${Date.now()}.sql`);
  writeFileSync(f, sql);
  try {
    execFileSync('npx', ['wrangler', 'd1', 'execute', DB, '--remote', '--file', f],
      { stdio: ['ignore', 'ignore', 'inherit'] });
  } finally {
    rmSync(f, { force: true });
  }
}

function d1Json(cmd) {
  const out = execFileSync('npx',
    ['wrangler', 'd1', 'execute', DB, '--remote', '--json', '--command', cmd],
    { encoding: 'utf8' });
  return JSON.parse(out);
}

function getMotion(id) {
  const j = d1Json(`SELECT id, status FROM motions WHERE id = ${id}`);
  return (j[0]?.results ?? [])[0] ?? null;
}

async function queue() {
  let after = 0, n = 0;
  for (;;) {
    const r = await fetch(`${SITE}/api/motions?status=pending&after=${after}`);
    if (!r.ok) die(`queue fetch failed: HTTP ${r.status}`);
    const j = await r.json();
    for (const m of j.motions) { n++; console.log(JSON.stringify(m)); }
    if (j.next_after === null || j.next_after === undefined) break;
    after = j.next_after;
  }
  console.error(`# ${n} pending motion(s)`);
}

function rule(idArg, disp, text) {
  if (!/^\d+$/.test(idArg ?? '')) die('rule needs a numeric motion id');
  if (!['granted', 'denied', 'deferred'].includes(disp)) {
    die('disposition must be granted, denied, or deferred (striking has its own verb)');
  }
  if (!text || !text.trim()) die('a ruling needs reasons; write them');
  const id = Number(idArg);
  const m = getMotion(id);
  if (!m) die(`no motion #${id}`);
  if (m.status !== 'pending' && m.status !== 'deferred') {
    die(`motion #${id} is already ${m.status}; file a new motion to reconsider (Canon VII)`);
  }
  d1File(`UPDATE motions SET status=${sq(disp)}, ruled_at=${NOW}, ruling=${sq(text)}
WHERE id=${id} AND status IN ('pending','deferred');
INSERT INTO log (actor, action, subject, detail)
VALUES ('maintainer', 'rule', ${sq('motion:' + id)}, ${sq(disp + ': ' + text)});`);
  console.log(`motion #${id}: ${disp}`);
}

function strike(idArg, reason) {
  if (!/^\d+$/.test(idArg ?? '')) die('strike needs a numeric motion id');
  if (!reason || !reason.trim()) die('a strike needs a stated reason');
  const id = Number(idArg);
  const m = getMotion(id);
  if (!m) die(`no motion #${id}`);
  if (m.status === 'stricken') die(`motion #${id} is already stricken`);
  d1File(`UPDATE motions SET status='stricken', ruled_at=${NOW},
title='[stricken]', body='[stricken]', ruling=${sq('[stricken: ' + reason + ']')}
WHERE id=${id};
INSERT INTO log (actor, action, subject, detail)
VALUES ('maintainer', 'strike', ${sq('motion:' + id)}, ${sq('stricken: ' + reason)});`);
  console.log(`motion #${id}: stricken`);
}

function logEntry(action, subject, detail) {
  if (!action || !detail || !detail.trim()) die('log needs: <action> <subject|-> <detail...>');
  const subj = subject === '-' ? 'NULL' : sq(subject);
  d1File(`INSERT INTO log (actor, action, subject, detail)
VALUES ('maintainer', ${sq(action)}, ${subj}, ${sq(detail)});`);
  console.log(`logged: ${action}`);
}

const [, , cmd, ...args] = process.argv;
switch (cmd) {
  case 'queue': await queue(); break;
  case 'rule': rule(args[0], args[1], args.slice(2).join(' ')); break;
  case 'strike': strike(args[0], args.slice(1).join(' ')); break;
  case 'log': logEntry(args[0], args[1], args.slice(2).join(' ')); break;
  default:
    die('usage: gavel.mjs queue | rule <id> <disposition> <text> | strike <id> <reason> | log <action> <subject|-> <detail>');
}
