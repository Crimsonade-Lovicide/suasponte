# STATE.md

What the last cycle left behind. Rewritten every cycle. Per-cycle history
lives in `logs/`, not here — this file is current state only, so it does
not grow without bound.

2026-08-27T01:57:04Z (operator-attended repair session):

- health: 2026-08-27T01:57:04Z -> 200 {"ok":true,"service":"suasponte","version":"genesis-1","time":"2026-08-27T01:57:05.210Z","checks":{"d1":"ok"}}
- issues_seen: none. Zero real GitHub issues open. 20 open pull requests,
  all harness- or cycle-generated bookkeeping. PR #2 (the unsolicited
  ecc-tools[bot] bundle) was closed unmerged on 2026-08-27 at the
  operator's direction, reasons posted on the PR; its branch survives
  because the git proxy refuses ref deletions, and revoking the app
  installation is the operator's — see NEEDS_HUMAN.md. PRs are no longer
  inbound and no longer wake the maintainer — see pulse.sh.
- open_work: none. 0 pending motions (`gavel.mjs queue` and
  `GET /api/motions?status=pending` agree).

Repaired a repetition loop this session. Symptom: log entries #32-#39,
eight consecutive cycles each re-deriving and re-logging the same finding
about OPERATOR.md's 2026-08-26 promote-the-site instruction, permanently,
into the append-only public log. Three compounding causes, all now
addressed except the third:

1. `pulse.sh` could never go quiet. It tested GitHub's `/issues`
   response for '"number"', but that endpoint returns pull requests too,
   and 21 PRs stand permanently open — so the probe reported work on
   every cycle for four days and BRIEF's quiet path never once ran. Fixed:
   items carrying a `pull_request` key are filtered out, pages are
   walked so a real issue cannot hide behind a wall of PRs, curl does the
   fetching (node's global fetch ignores the sandbox proxy and would have
   pinned the probe to "quiet", hiding real abuse reports). Verified live:
   `./pulse.sh` now prints "pulse: quiet" and exits 1, and still returns
   "issues" when a non-PR item is present.
2. The public log was absorbing non-actions. Fixed in BRIEF.md's
   site-specific section: four new subsections covering logging discipline
   (state changes only, never the same conclusion twice, a quiet cycle
   writes nothing), settled-is-settled (rule 0.3 covers re-verifying, not
   just re-deciding), what to do when `git push` fails, and why a cycle
   never opens a pull request. The numbered rules 0-10 are untouched,
   word for word.
3. STILL OPEN, and the root cause: cycle records stopped reaching main.
   Two mechanisms, not one — on 2026-08-23 the git proxy denied pushes
   outright (log #11/#15/#17); from 2026-08-26 the harness put each
   cycle on its own `claude/*` branch and opened a PR instead, and none
   were merged. Either way nothing landed on main between
   2026-08-24T13:32Z and this session while cycles kept running. Because STATE.md/NEEDS_HUMAN.md/logs are
   the only memory, a failed push destroys the cycle's memory and the next
   cycle starts blind — writing its findings into the one store that does
   persist and can never be cleaned. Reserved to the operator (rule 8:
   credentials). See NEEDS_HUMAN.md.

Also shipped the achievable half of the operator's promote-the-site goal:
an Atom feed at `/feed.xml` (`atomFeed` in src/lib.js), with
autodiscovery in every page head and a "feed" link in the nav. A docket
that rules in public every hour and offered no feed was leaving the only
zero-cost distribution channel it can legitimately operate unbuilt. The
outbound half — posting to aggregators — is settled as not the
maintainer's to do, in NEEDS_HUMAN.md; it needs no further verification.

Verified this session, not trusted from notes: health 200 on
`genesis-1`, `npm test` 20/20 green, both new tests confirmed red
against the pre-fix code and green after, `/feed.xml` parsed as
well-formed Atom by a strict XML parser both locally and live, hostile
motion text round-trips as inert text, all ten routes 200. Deployed once
this session. Nothing is half-finished.
