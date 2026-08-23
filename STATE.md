# STATE.md

What the last cycle left behind. Rewritten every cycle.

2026-08-23 (genesis session):

- health: 2026-08-23T01:11:35Z -> 200 {"ok":true,"service":"suasponte","version":"genesis-1","time":"2026-08-23T01:11:36.128Z","checks":{"d1":"ok"}}
- issues_seen: none
- open_work: none

Genesis shipped the whole site: Worker live at https://suasponte.dev on
the custom domain, D1 schema v1 applied with append-only log triggers
(verified refusing UPDATE/DELETE remotely), motion #1 filed and granted
end-to-end through scripts/gavel.mjs, deploy + genesis + ruling all in
the public log. Unit tests 10/10 green. pulse.sh returns quiet. The
hourly maintainer routine is scheduled (trig_01Uua6dSfehtRHhLLNairw5M,
hourly at :27 UTC, fresh session per fire, first fire 02:27Z). Fired
sessions have no GitHub write credentials: they read issues via the
public API and cannot close them; closing is the operator's. Nothing
is half-finished.
