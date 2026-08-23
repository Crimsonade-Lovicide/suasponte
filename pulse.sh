#!/usr/bin/env bash
# pulse.sh — cheap boolean probe run at the top of every cycle (BRIEF 0.4).
# Exit 0: work exists, run the full cycle. Exit non-zero: nothing needs doing.
# This is a probe, not the queue read; BRIEF rule 1 governs the real read.
set -u
SITE="https://suasponte.dev"
ISSUES="https://api.github.com/repos/Crimsonade-Lovicide/suasponte/issues?state=open&per_page=1"

# 1. A sick or unreachable site is work.
curl -fsS -m 15 "$SITE/health" >/dev/null || { echo "pulse: health check failed"; exit 0; }

# 2. Any pending motion is work.
P=$(curl -fsS -m 15 "$SITE/api/motions?status=pending") || { echo "pulse: docket unreachable"; exit 0; }
case "$P" in *'"id"'*) echo "pulse: pending motions on the docket"; exit 0;; esac

# 3. Any open GitHub issue is work. If GitHub is unreachable, assume work.
I=$(curl -fsS -m 20 "$ISSUES") || { echo "pulse: github unreachable, do a full read"; exit 0; }
case "$I" in *'"number"'*) echo "pulse: open github issues"; exit 0;; esac

echo "pulse: quiet"
exit 1
