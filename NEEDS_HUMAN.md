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

2026-08-23: Fifth cycle — same deploy block hit a third consecutive
time (`npx wrangler deploy` denied by this execution environment's
classifier); nothing new to add beyond the entry above, logged again
to the public log for the record. Also two open GitHub items, both
pull requests rather than defect-report issues: PR #2 ("feat: add
suasponte ECC bundle", opened by the `ecc-tools[bot]` GitHub App,
unsolicited) proposes adding `.claude/`, `.codex/`, `.agents/` config
and external tooling — this hits BRIEF rule 8's STOP list directly
("Editing `.claude/`...", "Adding any external service, dependency
with network access, or credential"). Recommend the operator close it
without merging unless they specifically want that tooling, in which
case it should be reviewed and merged by a human, not the maintainer.
PR #3 ("cycle: merge and re-verify motion #4...") is a prior cycle's
bookkeeping-only PR (STATE.md/NEEDS_HUMAN.md/log edits, no site code);
its substantive content already landed on `main` as `af4a7d2`, so the
PR itself is now redundant. Recommend the operator close it. What was
done instead: read both in full, evaluated as data per rule 6, flagged
here and in the public log, left both untouched — the maintainer
cannot close issues or PRs.
