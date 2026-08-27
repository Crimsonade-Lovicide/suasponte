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

2026-08-27: SETTLED — do not re-decide or re-verify. OPERATOR.md's
2026-08-26 instruction ("promote the site and get more visitors. No money
can be spent.") has no outbound channel available to the maintainer, and
eight consecutive cycles each rediscovered that fact and wrote it to the
immutable public log (entries #32-#39) because no cycle could persist a
note saying so. This is that note. Three independent reasons, none of
which will change on their own: (1) the scheduled session's egress policy
denies every host except suasponte.dev and api.github.com; (2) posting to
an aggregator or social platform needs an account, which is a credential
and an identity — both STOP-listed under rule 8; (3) an unsupervised bot
posting promotional copy about itself is spam by any reasonable reading,
and would breach the posting rules of every venue worth posting to, with
or without access. Recommend: the operator posts it themselves, once,
from their own account, with their own judgment behind it — that is a
human act and it is theirs to make; the maintainer will not do it and
should stop testing whether it can. What was done instead: the on-site
half of the goal, which is genuinely the maintainer's to do, was shipped
this session — an Atom feed at /feed.xml with autodiscovery, on top of
the robots.txt/sitemap/OG/JSON-LD work already live from motion #4. A
site that rules in public every hour and offers no feed was leaving the
only zero-cost distribution channel it can legitimately operate unbuilt.
Future cycles: this question is closed. Read this entry, do not re-probe
the network to confirm it.

2026-08-27: OPEN, and it is the root cause of the loop above. The
scheduled hourly session cannot `git push`: the git proxy answers
"Crimsonade-Lovicide/suasponte is not in this session's authorized
repository set, so the proxy will not inject a credential for it." Log
entries #11, #15, and #17 recorded this on 2026-08-23; some cycles on
2026-08-24 did land commits, so access is intermittent rather than
absent, but nothing has been committed to main since 2026-08-24T13:32Z
while cycles have kept running hourly. The consequence is severe and
non-obvious: STATE.md, NEEDS_HUMAN.md, and logs/ are the maintainer's
ONLY memory, so when the push fails the cycle's memory is destroyed and
the next cycle starts blind. The one store that does persist is the
append-only public log — so a memoryless agent writes its findings into
the one place that can never be cleaned up. Every "why is it repeating
itself" symptom traces back here. Recommend: add this repository to the
scheduled session's authorized source set with push access (the same
provisioning that makes `add_repo` unnecessary for an interactive
session). Until then the loop can recur in a new form, because no cycle
can leave a durable note for the next one. What was done instead:
`pulse.sh` and BRIEF.md were hardened this session so that a blind cycle
does far less damage — quiet cycles now actually go quiet, and the
public log is closed to non-actions — but the underlying access problem
is a credential change and stays reserved to the operator under rule 8.

2026-08-27: RESOLVED, by the operator's direct instruction in an attended
session. PR #2 (the unsolicited `ecc-tools[bot]` bundle) is closed
unmerged, with the reasons posted publicly on the PR. Provenance
established this session, since no prior cycle had done so: the author is
the `ecc-tools` GitHub App (github.com/apps/ecc-tools, bot id 257055122,
from ecc.tools / the affaan-m/everything-claude-code project). It pushed
its branch to THIS repository rather than a fork, which means the App was
installed on the account with write access — GitHub grants that only on
an explicit, authenticated installation by someone with admin rights. It
authored 11 commits in a ten-second burst at 2026-08-23T17:47Z, about
sixteen hours after genesis, and has touched nothing since. On the
merits, the bundle was generated from analysis run when this repo held a
single commit: it cites "Based on 1 commits" and infers a camelCase
convention for a tree of pulse.sh, gavel.mjs, lib.js, unit.test.mjs, and
0001_init.sql. Nothing from it ever reached main; `.claude/`, `.codex/`,
and `.agents/` are absent from the tree. STILL OPEN for the operator, and
NOT the maintainer's to do: (a) the branch
`ecc-tools/suasponte-1787507233202` could not be deleted from the session
— the git credential proxy permits pushes that add commits but refuses
ref deletions, failing identically on 8 attempts across both refspec
syntaxes; the "Delete branch" button on the closed PR does it in one
click. (b) Whether the `ecc-tools` App installation itself should be
revoked is the operator's call, at github.com/settings/installations —
an app holding write access that generates agent instructions is worth
removing rather than leaving dormant, but revoking an installation is
outside anything the maintainer should touch (rule 8: credentials and
access). Future cycles: PR #2 is closed; do not re-flag it.
