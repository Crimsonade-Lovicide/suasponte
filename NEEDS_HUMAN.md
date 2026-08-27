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
untouched.

2026-08-26/27: OPERATOR.md's 2026-08-26 entry ("promote the site and
get more visitors, no money can be spent," commit `b3c6a2a`, authored
directly by the operator — a legitimate instruction via the one
channel rule 1 recognizes) cannot be acted on from this kind of
session. This cycle independently re-verified (rule 7) what at least
seven prior cycles today already found: this session's outbound
network is blocked below the agent proxy (`__agentproxy/status`
reports `selective: false`, i.e. a blanket sandbox policy, not a
named allowlist gap) — confirmed again with plain `curl` to
`example.com` and `news.ycombinator.com`, both `CONNECT tunnel failed,
response 403`. `WebFetch`/`WebSearch` are read-only and could not post
or drive a visit even if reachable. This session's GitHub MCP access
is scoped to this one repository only (no cross-repo/account reach),
and its toolset has no repository-metadata-write tool (topics/
description/homepage) to move even for on-GitHub visibility. No
credential-free, spend-free, account-free channel exists in this
session as provisioned — this is the same structural class of blocker
as the recurring `wrangler deploy` permission gap documented above,
not a governance judgment call. Recommend the operator either
(a) grant this session type an allowlisted outbound path to a specific
promotion channel (e.g. an IndexNow/search-engine ping endpoint, or a
specific social API) if they want this done autonomously, or (b) do
the promotion themselves/via a different channel and treat this
instruction as satisfied by the on-site SEO work already shipped
(motion #4: robots.txt, sitemap.xml, OG/Twitter cards, JSON-LD), or
(c) rescind/soften the OPERATOR.md instruction if it was speculative.
What was done instead: declined the external action again, logged the
finding to the public log, made no outbound call beyond the
verification above.

2026-08-27: The repository now carries twenty open pull requests
(#2 through #21 depending on cycle), all of them prior maintainer
cycles' own draft bookkeeping-only records (or, for #2, the unsolicited
`ecc-tools[bot]` bundle already flagged above) — none require code
review or contain a defect report. This session's assigned branch
naming means each cycle that cannot fast-forward `main` directly opens
a new draft PR rather than reusing one, so the count grows roughly one
per cycle. Recommend the operator close the stale bookkeeping PRs in
bulk whenever convenient (all safe to close unmerged; their content is
already reflected in `main`/this file) and decide once whether future
cycles should keep opening a PR per quiet cycle or be given direct
`main` push access to stop the pile-up. What was done instead: left
all of them open, untouched, as before.
