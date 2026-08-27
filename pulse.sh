#!/usr/bin/env bash
# pulse.sh — cheap boolean probe run at the top of every cycle (BRIEF 0.4).
# Exit 0: work exists, run the full cycle. Exit non-zero: nothing needs doing.
# This is a probe, not the queue read; BRIEF rule 1 governs the real read.
set -u
SITE="https://suasponte.dev"
REPO="Crimsonade-Lovicide/suasponte"

# 1. A sick or unreachable site is work.
curl -fsS -m 15 "$SITE/health" >/dev/null || { echo "pulse: health check failed"; exit 0; }

# 2. Any pending motion is work.
P=$(curl -fsS -m 15 "$SITE/api/motions?status=pending") || { echo "pulse: docket unreachable"; exit 0; }
case "$P" in *'"id"'*) echo "pulse: pending motions on the docket"; exit 0;; esac

# 3. Any open GitHub *issue* is work. Pull requests are NOT.
#
#    GitHub's /issues endpoint returns pull requests alongside issues, and only
#    issues are the advertised abuse/takedown channel. This probe used to test
#    the raw response for '"number"', so the standing open PRs pinned it to
#    "work" on every single cycle for days, and the quiet path in BRIEF 0.4 and
#    rule 10 never once ran. Items carrying a `pull_request` key are filtered
#    out here, and pages are walked so a real issue cannot hide behind a wall
#    of PRs.
#
#    Fetch with curl, classify with node: curl honours the sandbox's HTTPS
#    proxy, node's global fetch does not (it would report every host
#    unreachable and pin this probe to "quiet", hiding real abuse reports).
#
#    If GitHub is genuinely unreachable the probe stays QUIET: a full cycle
#    could not read the issue queue either, so waking for it accomplishes
#    nothing, and the next cycle retries an hour later.
classify() {
  node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d)).on("end", () => {
      try {
        const j = JSON.parse(s);
        if (!Array.isArray(j)) return console.log("bad");
        if (j.some((x) => !x.pull_request)) return console.log("issues");
        console.log(j.length < 100 ? "last" : "more");
      } catch { console.log("bad"); }
    });
  ' 2>/dev/null
}

github_state() {
  local p=1 body verdict
  while [ "$p" -le 5 ]; do
    body=$(curl -fsS -m 20 -H 'accept: application/vnd.github+json' \
      "https://api.github.com/repos/$REPO/issues?state=open&per_page=100&page=$p") \
      || { echo unreachable; return; }
    verdict=$(printf '%s' "$body" | classify)
    case "$verdict" in
      issues) echo issues; return;;
      last)   echo none; return;;
      more)   ;;
      *)      echo unreachable; return;;
    esac
    p=$((p + 1))
  done
  echo none
}

GH=$(github_state)
case "$GH" in
  issues)      echo "pulse: open github issues"; exit 0;;
  unreachable) echo "pulse: github unreachable, staying quiet; next cycle retries"; exit 1;;
esac

echo "pulse: quiet"
exit 1
