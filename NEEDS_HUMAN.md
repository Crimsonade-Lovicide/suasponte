# NEEDS_HUMAN.md

Decisions the maintainer will not make on its own. Append only.
Format: date, the question, what the maintainer recommends, what it did instead.

2026-08-23: Motion #3 ("Get More Visitors - SEO and GEO") asks the
maintainer to optimize the site for SEO/GEO, draft and execute a plan
to post on Reddit to drum up interest, spend up to $5 doing so, and
"do whatever else you think is beneficial to reach this goal." This
bundles three STOP-list items (rule 8): spending money, adding/using
an external service (a Reddit account/posting) not currently part of
the deployment, and making a public commitment/promotional statement
on the operator's behalf. Recommend: the operator either (a) files a
narrower motion scoped to on-site SEO only (meta tags, sitemap.xml,
robots.txt, structured data — no money, no external accounts, no
outbound posting), which the maintainer can then grant and ship
normally, or (b) explicitly authorizes a Reddit account/credential and
a spend ceiling via OPERATOR.md if they want the promotional piece
done autonomously. What was done instead: ruled motion #3 "deferred"
in the public log with these reasons; no code, spend, or outreach
happened.

2026-08-23: Motion #4 (on-site discoverability: meta tags, OG/Twitter
cards + share image, robots.txt, sitemap.xml, JSON-LD, link text) was
granted and fully implemented and tested this cycle — see the public
log and the motion's ruling for what shipped in code. But `npx wrangler
deploy` was declined outright by this execution environment's own
safety controls, which treat a headless, unsupervised session pushing
to live production infrastructure as an action requiring a human in
the loop. This is not a BRIEF governance question and the court is not
asking permission to do the deploy — rule 8 lists it here because it
is a recurring, structural blocker, not a one-off judgment call: every
future cycle that tries to `wrangler deploy` from this kind of session
will likely hit the same restriction. Recommend the operator either
(a) deploy this commit manually this once (`npx wrangler deploy` from
a trusted environment, then confirm `/health` and `/og.png`), or
(b) if they want the maintainer to keep deploying autonomously, adjust
whatever permission/classifier configuration governs this session type
to allow the deploy action, or (c) if deploys should always be
human-gated going forward, say so in OPERATOR.md so future cycles stop
attempting them and instead always hand off a ready-to-deploy commit.
What was done instead: shipped the code and the ruling, logged the
blocked deploy in the public log, left the live site untouched and
still healthy on the prior version.

2026-08-23: Resolved, no action needed. Verified this cycle (rule 7 —
not trusted from prior notes): motion #4's on-site discoverability work
is live in production. `curl https://suasponte.dev/robots.txt`,
`/sitemap.xml`, and `/og.png` all return the expected content
byte-for-byte matching what's in `src/`, and the homepage serves the
new OG/Twitter meta tags and JSON-LD. Someone with deploy access ran
`wrangler deploy` since the last cycle's note (main's merge commit
`af4a7d2`, authored by the operator, says as much). The recurring
"headless sessions can't deploy" structural blocker described in the
two entries above may still recur for future cycles — this entry only
confirms *this specific* deploy went out; it does not change the
recommendation above.

2026-08-23: Found on GitHub this cycle, not by anything the maintainer
did: an open, non-draft PR #2 ("feat: add suasponte ECC bundle",
opened by the `ecc-tools[bot]` GitHub App, unsolicited — nobody filed
a motion for it) proposes adding `.claude/ecc-tools.json`,
`.claude/identity.json`, `.claude/skills/`, `.claude/homunculus/`,
`.codex/config.toml` (which wires up MCP servers including one that
proxies through `mcp.exa.ai`), `.codex/AGENTS.md`, and `.agents/`
files. This hits rule 8 directly and repeatedly: it edits `.claude/`,
and it adds external services/dependencies with network access and,
per its own `.codex/config.toml`, credentials/MCP wiring the
maintainer never asked for. Recommend: close it without merging unless
the operator specifically wants this tooling, in which case review
each file individually rather than merging the bundle wholesale. What
was done instead: left it untouched and unmerged; the maintainer has
no issue/PR-closing access per BRIEF and would not use it here even if
it did, since PR review/merge on this scale is exactly the kind of
judgment call rule 8's last bullet reserves for a human.

2026-08-23: Also found on GitHub this cycle: two more open PRs, #3 and
#4, both draft, both opened by prior maintainer cycles as
bookkeeping-only records (STATE.md/NEEDS_HUMAN.md/log-file edits, no
site code) against a `main` that has since moved on — their substance
is already reflected in what's on `main` and in this file directly.
They are stale, not a decision the maintainer is positioned to make
(closing PRs is left to the operator per BRIEF), and harmless as-is.
Recommend: the operator close #3 and #4 as superseded whenever
convenient; no urgency. What was done instead: left both open,
untouched.

2026-08-23: A fourth open PR was found this cycle, #5, same category as
#3 and #4 above: a prior maintainer cycle's own bookkeeping-only draft
PR (STATE.md/log edits, no site code), opened after the entry above was
written, already superseded by what landed on `main` directly. Not a
new decision — extends the existing recommendation. Recommend: the
operator close #3, #4, and #5 together as superseded, whenever
convenient; no urgency. What was done instead: left all three open,
untouched. (By 2026-08-26 this same stale-bookkeeping-PR pattern had
grown to #3 through #13; the recommendation is unchanged, just wider.)

2026-08-26: OPERATOR.md's same-day entry ("promote the site and get
more visitors, no money can be spent," commit `b3c6a2a`, verified
authored directly by the operator) resolves the money leg of motion
#3's 2026-08-23 deferral, but names no specific external channel,
account, or credential — rule 8 still reserves adding one to a human.
Four consecutive cycles today (PRs #14, #15, #16, and this cycle)
independently re-verified live that no such channel is reachable from
this session as provisioned: outbound network access is policy-denied
to every external host tried (this cycle: Hacker News, Reddit,
DuckDuckGo, Bing, Marginalia, IndexNow, Google — 7/7 `CONNECT`-denied
by the agent proxy), and this session's GitHub MCP toolset has no
repository-metadata-write tool (topics/description/homepage), which
would otherwise have been a zero-cost, credential-free discoverability
lever. Recommend the operator pick one of: (a) allowlist a specific,
named promotion channel in this session's network egress policy (e.g.
a search-engine sitemap-ping endpoint, or one named forum/directory
URL) so a future cycle can act without any new account; (b) set the
repository's own topics/description/homepage directly — a five-minute
manual action, no code involved, immediately helps GitHub and
web-search discoverability; or (c) if a specific external account
(Reddit, X, a forum) is wanted, authorize it explicitly via a dated
OPERATOR.md entry naming the account/credential per rule 8. What was
done instead this cycle: no external action taken, no money spent, no
new credential added; on-site SEO groundwork from motion #4 (robots.txt,
sitemap.xml, OG/Twitter tags, JSON-LD) stands as the maintainer's own
contribution to this goal so far.

2026-08-26: New structural finding, not a re-decision of anything
above: this session's harness assigns a feature branch and opens a
GitHub PR each cycle rather than pushing cycle records to `main`
directly (unlike earlier cycles through 2026-08-24, which pushed to
`main` directly). None of today's cycle-record PRs (#14, #15, #16, and
this cycle's) have been merged, so `main`'s own `STATE.md`/
`NEEDS_HUMAN.md` had gone two days stale relative to the live docket
and public log (which stay current every cycle regardless, since they
are written straight to D1 via `gavel.mjs` and re-verified live per
rule 7 — site correctness is unaffected). Recommend the operator merge
the most recent such PR (or this cycle's) into `main` when convenient,
and close the superseded ones, so the bookkeeping trail on `main`
matches reality again. What was done instead: continued writing the
full record to this cycle's own branch/PR per the harness's own
instructions, and flagging the gap here rather than force-pushing to
`main` against the harness's explicit branch policy.

2026-08-26: Fifth consecutive cycle today re-confirming the entry
above, not a new decision: this cycle additionally tested via
`WebFetch` (a different mechanism than the shell's `curl`, which is
what all four prior cycles used) against a Google sitemap-ping URL and
got `EGRESS_BLOCKED` directly from the tool layer — the same
infrastructure-level block, independent of which tool issues the
request. `WebSearch` (a hosted search, distinct from a direct fetch)
does work and confirms suasponte.dev has no search-engine presence
yet, which is real evidence the underlying problem is genuine, not
evidence of any channel to act on it from here. The three
recommendations above stand unchanged. `main` is now three days stale
(unchanged recommendation: merge the latest cycle PR forward). What
was done instead: no external action taken, no money spent, no
credential added; logged a brief confirming note to the public log
(id 35) instead of repeating the full writeup.
