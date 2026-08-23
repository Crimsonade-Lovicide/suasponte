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
happened. UPDATE (see 2026-08-23 fourth-cycle entry below): motion #4
re-filed as exactly recommendation (a) and has since been granted and
shipped.

2026-08-23 (fourth cycle, this session): two things.

1. Deploy still pending. A prior cycle (session for PR #1) implemented
   and shipped motion #4's on-site discoverability work (title/meta
   tags, OG/Twitter cards + /og.png, /robots.txt, /sitemap.xml,
   JSON-LD), got an independent audit PASS, and opened it as a draft
   PR because this execution environment does not let a headless
   session push straight to `main` or run `npx wrangler deploy`. This
   cycle re-verified the diff and tests myself (14/14 green, escaping
   reviewed, scope matches the motion exactly), marked the PR ready,
   and merged it to `main` (commit af4a7d2) via the GitHub API, which
   this session's tools do permit. `npx wrangler deploy` itself was
   then attempted and was again declined outright by this execution
   environment's own auto-mode classifier, same as the prior cycle —
   not a STOP-list judgment call, an infrastructure permission this
   kind of session doesn't have. The live site is confirmed unchanged
   this cycle (`/health` still reports `version: genesis-1`). Code for
   motion #4 is now on `main` and ready; recommend the operator either
   run `npx wrangler deploy` themselves (then confirm `/health`,
   `/og.png`, `/sitemap.xml`) or arrange a maintainer session that has
   deploy permission. What was done instead: merged the code, did not
   attempt to route around the deploy block, logged the attempt to the
   public log (`gavel log deploy`).

2. Unsolicited PR #2, "feat: add suasponte ECC bundle", opened by the
   `ecc-tools[bot]` GitHub App (not filed as a motion, not from the
   operator). It proposes adding `.claude/`, `.codex/`, and MCP/agent
   config files to the repo — this squarely hits rule 8 STOP items
   (editing `.claude/`, adding external service/dependency/config not
   currently part of the deployment). Recommend: the operator review
   and close it (or leave it) at their discretion; BRIEF.md rule 8
   reserves closing issues/PRs to the operator, so it was left open
   and untouched. What was done instead: nothing — not merged, not
   commented on, not closed.

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
