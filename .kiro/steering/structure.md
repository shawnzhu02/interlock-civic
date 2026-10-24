---
inclusion: always
---

# Structure

```
interlock/            the engine (standard library only)
  gate.py             Gate: propose, authorize, write DISPATCHED to disk, send, commit; recover() after a crash
  journal.py          append-only journal (JSONL or SQLite), effect_id_for(), the hash chain
  leases.py           authority as a lease, checked at dispatch and again on recovery
  approvals.py        Envelope, Rule, Route, Authority, Inbox: the pre-action rules and the person queue
  escalation.py       explain(), describe(), diff(): what changed, in words a person can act on
  confirm.py          confirm_event() (signed webhooks) and confirm_by_lookup(): outcome confirmation
  receipts.py         bundle(), sign(), verify(): the four facts and a final state
  scoreboard.py       numbers derived from the journal alone
  easy.py, tools.py   the short integration API and the gated tool wrapper
  mcp_proxy.py        the gate as an MCP proxy (interlock-mcp)
  targets/            adapters for one system each; payments.py is a simulated payments API with tiers 1 to 3,
                      stripe_api.py is real Stripe in test mode
  integrations/       ADK and AP2 adapters
  export/             receipts to BigQuery, Cloud Logging, OTLP, SIEM
backend/              the live demo server (api.py) and worker processes
demo/                 demo pages served by backend/api.py
viewer/               an animated replay of the real journal (build.py generates traces.js)
experiments/          reproducible experiments; run_all.py writes results/
scenarios/            real-world scenario fixtures
tests/                unittest suite; one file per feature
docs/                 the contract, the landscape, integration notes
```

## Conventions

- **One target per system.** New civic systems go in `interlock/targets/`, each with an `explain()` that reads its premises. Examples: the benefit payment rail, the simulated case system, the simulated ledger, the appointment scheduler. Model them on `targets/payments.py`.
- **Tiers.** Every target states which of the three tiers it supports: it dedupes, it can be looked up, or neither. Recovery acts by tier and never guesses.
- **Effect ids.** An effect id comes from the approved request (`effect_id_for`), never from the model. A repair gets a new effect id; it is never the refused one with a different payload.
- **Domain wording** for civic actions lives next to the target. The engine stays domain-neutral.
- **New code reuses the engine.** Pre-action rules extend `approvals.Rule` and `Route`. Outcome tracking extends `confirm.py`. The person queue is `approvals.Inbox`. Do not write a second state machine.
