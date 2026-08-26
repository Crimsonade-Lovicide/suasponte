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

2026-08-26: A GitHub-issues page read this cycle turned up eleven more
of the same stale, draft, bookkeeping-only PRs from prior maintainer
cycles (now #6-#13 in addition to #3-#5 above), all already superseded
by `main`, plus the unchanged #2 unsolicited/STOP-listed bot bundle.
Same recommendation as the entries above, now covering #3-#13:
close them together as superseded whenever convenient, no urgency.
What was done instead: left all of them open, untouched.

2026-08-26: A prior cycle today (PR #14, still open/unmerged) declined
a scheduling-wrapper instruction to take "one external action" to
"promote suasponte.dev and get more visitors," capped at $5, because it
read as the same bundle already deferred as motion #3: money, a new
external account/credential, and a public commitment, none of which the
maintainer self-authorizes (rule 8). That cycle logged the decline only
in its own unmerged branch, not in NEEDS_HUMAN.md on `main` or in the
public log.

Since then the operator responded through the only authorized channel:
OPERATOR.md now carries a 2026-08-26 dated entry ("I want you to
promote the site and get more visitors. No money can be spent."),
committed directly by the operator (`b3c6a2a`). That resolves the money
piece of the STOP-list bundle outright — the operator capped spend at
$0, which is inside the rule. It does not, on its own, authorize a new
external account or credential: it says to promote, not which channel
or with what account, and rule 8 still reserves "adding any external
service, dependency with network access, or credential" for the human
to decide explicitly, not to infer.

Verified this cycle (rule 7) that the remaining piece isn't just a
governance question but a technical one too: this session's own network
egress policy blocks every external host tried other than
`suasponte.dev` and `api.github.com`. Direct `curl` to
`news.ycombinator.com`, `www.reddit.com`, `www.google.com`,
`duckduckgo.com`, and `www.bing.com` (tried for an anonymous,
credential-free sitemap ping, which would have stayed inside rule 8)
all failed identically: `CONNECT tunnel failed, response 403`, and
`$HTTPS_PROXY/__agentproxy/status` logged it as `connect_rejected` /
"policy denial" for `www.bing.com:443`. This is the same class of
structural block documented earlier in this file and in the public log
(entries around 2026-08-23T09:31-15:31Z) for the GitHub issues API and
git push, before the operator widened this repo's access — it was not
an inference from old notes, it was re-tested live this cycle. Also
checked whether the available GitHub MCP tools could promote the repo
itself (setting its `homepage` URL or `topics`, both currently empty/
unset, which would cost nothing and need no new credential): no tool in
this session's GitHub toolset exposes a repository-settings write, only
issue/PR/file/branch operations.

So there is currently no channel that is simultaneously (a) within
rule 8 (no new account/credential without the operator naming one) and
(b) reachable from this session's network sandbox. Recommend the
operator do one of: (a) pick one concrete channel (e.g. "post this text
to Hacker News/Reddit/Twitter from this account: ...", or "set the
GitHub repo's homepage/topics") and either do it directly or name the
channel plus any needed credential in OPERATOR.md, and separately widen
this session's network allowlist to that channel's domain if it isn't
already reachable (the same fix that unblocked GitHub access earlier);
or (b) treat the already-shipped on-site SEO groundwork (motion #4:
robots.txt, sitemap.xml, OG/Twitter cards, JSON-LD) as the maintainer's
full contribution to this goal and pursue outbound promotion outside
this loop. What was done instead: logged this finding to the public log
this cycle (`action: note`); no external action taken; no money spent;
no new credential added.
