# Design: civic-case-actions

## Overview

Four civic actions reach their systems of record only through the Interlock
gate. The design adds **no new state machine**: it plugs civic domain objects
into the existing engine. Concretely:

- The pre-action rules, routing, and person queue reuse `interlock/approvals.py`
  (`Rule`, `Route`, `Authority`, `Inbox`).
- Dispatch, journaling, premise re-validation, lease checks, crash recovery, and
  receipts reuse `interlock/gate.py` (`Gate`).
- Each system that an action changes gets **one target** modeled on
  `interlock/targets/payments.py`, with a tier and an `explain()` that reads its
  premises. Domain wording lives next to the target; the engine stays
  domain-neutral (per `.kiro/steering/structure.md`).

This document references, and does not repeat, the product rules
(`.kiro/steering/product.md`), the receipt and lifecycle rules
(`.kiro/steering/receipts.md`), the tech constraints
(`.kiro/steering/tech.md`), and the structure conventions
(`.kiro/steering/structure.md`).

### How the engine pieces map to civic concepts

From reading `gate.py`, `approvals.py`, and `targets/payments.py`:

- A **proposal** is `{agent, lease, premises, effect, request}`. `effect_id_for`
  derives a stable effect id from the request; the model never supplies it
  (gate invariants I2, I5).
- **Premises** are the facts the decision was made on. The gate re-validates
  them against the target at commit time and again during recovery (I3). This is
  exactly where "eligible and active at send time, not decision time" is
  enforced — we do not write a bespoke check.
- A **lease** is the authority an effect runs under. `Gate._lease_seen` calls
  `leases.is_live` / `allows`. `approvals.Authority` is the lease store for
  person-approved and policy sends; it reads membership and freshness live, so a
  removed or expired caseworker fails closed (I4).
- An **`EffectTarget`** declares a `tier`, implements `apply`, `query` (tier 1/2),
  and `explain(premises, eid, effect)`. `Payments` is the template: tier 1
  dedupes on `eid`; `query` lists by `eid`; `explain` returns
  `{violations, changes, repairs}` computed from `validate_premises`.
- The **`Inbox`** runs rules, sends under a policy lease when all pass, and
  escalates to a `Route`'s group otherwise. `tick()` moves unanswered
  escalations up the route chain after the SLA. All of this is journal-backed, so
  a restart rebuilds the queue.

## Architecture

```
AI assistant / Kiro
        │  (MCP)
        ▼
backend/civic_mcp_server.py  ── four actions + read tools (stdlib MCP server)
        │  proxied through
        ▼
interlock/mcp_proxy.py  ──  civic-office-gated  (config: .kiro/settings/interlock.mcp.json)
        │
        ▼
backend/civic/office.py  ──  CivicOffice facade: builds proposals, owns one Inbox per action family
        │                     capture() reads premises from the systems of record
        ├── interlock/approvals.py   Rule, Route, Authority, Inbox   (pre-action decision)
        ├── interlock/gate.py        Gate                            (dispatch, recovery, receipts)
        └── interlock/targets/civic/*.py  one target per system
                │
                ├── payment_rail.py   tier 1  (reissue + refund; wraps Payments / stripe_api)
                ├── scheduler.py      tier 2  (book_appointment; SQLite)
                └── case_records.py   tier 2  (change_address; SQLite)
                        │
                        ▼
                backend/civic/  (SQLite)  case system · ledger · scheduler   [all labeled simulated]
```

### Component responsibilities

**`backend/civic/` — simulated systems of record (SQLite, stdlib only).**
Model on the data that `Payments` holds in memory, but persisted in SQLite and
labeled simulated.

- `case_store.py` — residents, cases, per-period entitlements, eligibility/active
  flags, mailing address, assigned caseworker, fraud flag. Read helpers:
  `entitlement(case_id, period)`, `status(case_id)` → `{eligible, active}`,
  `address(case_id)`, `caseworker(case_id)`, `fraud_flagged(case_id)`.
- `ledger.py` — append-only payments and refunds the office has recorded, keyed
  so prior reissues for a `(case_id, period)` can be counted *from any source*:
  `reissues_for(case_id, period)`, `recorded_total(case_id, period)`.
- `scheduler_store.py` — appointment bookings, lookup-able by a reference tied to
  the effect id.

Every table/display name and log line carries a "simulated" label (Req 2.5).

**`interlock/targets/civic/` — one target per system.** Each follows the
`Payments` shape: a `tier` attribute, `apply(eid, effect, crash_after_effect=False)`,
`query(eid, effect)` (tier 1/2), and `explain(premises, eid, effect)` →
`{violations, changes, repairs}` built on a `validate_premises`.

- `payment_rail.py` — **tier 1**. Backs `reissue_payment` and `refund_fee`. In
  simulation it reuses `interlock/targets/payments.py` (`Payments(tier=1)`); in
  live mode it uses `interlock/targets/stripe_api.py` (test keys only). `apply`
  sends a Stripe refund with `eid` as the Idempotency-Key; `query` lists refunds
  by `eid`. `explain` reports entitlement/eligibility/prior-reissue changes.
  Premises captured: `{case_id, period, entitlement, eligible, active, prior_reissues}`.
- `scheduler.py` — **tier 2**. Backs `book_appointment`. `apply` writes a booking
  with a reference derived from `eid`; `query` looks it up by that reference.
- `case_records.py` — **tier 2**. Backs `change_address`. `apply` writes the new
  address tagged with `eid`; `query` looks up whether the change tagged with
  `eid` landed. `explain` reports if the case became ineligible/closed, or if the
  address was changed elsewhere since the decision.

Domain wording for refusals lives in these targets' `explain()` methods, next to
the premises they read (Req 1.5, Req 5.3).

**`backend/civic/office.py` — `CivicOffice` facade.** The thin domain layer that
turns an action call into a gate proposal and owns the `Inbox` wiring. It does
*not* re-implement decisions.

- For each action it defines the `effect(request)` payload and the
  `capture(request)` function that reads the premises from the systems of record
  (case store for entitlement/eligibility/address/caseworker, ledger for prior
  reissues). `capture` is what makes the premises independent of the assistant.
- It constructs one `Inbox(gate, capture, effect, rules, routes)` per action
  family (payments vs. scheduler vs. case-records), each with its own `Gate` and
  target.
- Time is injected (`clock=`) per `.kiro/steering/tech.md`.

### The pre-action rules (reusing `approvals.Rule` / `Route`)

Each rule is an `approvals.Rule(name, check)` where `check(request, facts)`
returns `False` to send the action to a person. The `facts` passed in are the
captured premises, so a rule only reads facts that become the effect's premises
(Req 7.5). The rules:

| rule name | check | requirement |
|---|---|---|
| `within entitlement` | `request.amount <= facts.entitlement` | Req 3 |
| `at most one reissue per period` | `facts.prior_reissues == 0` (counts all sources) | Req 4 |
| `case eligible and active` | `facts.eligible and facts.active` | Req 5 |

Routing (`approvals.Route`), first match wins:

- `large` — `when = request.amount > LIMIT` → chain `["caseworkers"]`, with an SLA (Req 7.1, 7.3).
- `flagged` — `when = facts.fraud` → chain `["caseworkers"]`, with an SLA (Req 7.2, 7.3).
- `DEFAULT` — anything a rule failed that is not otherwise routed still goes to a person via `Inbox` (Req 7.4).

Two layers enforce the same facts, by design:

1. **Rules** decide *up front* whether a person is needed (cheap, over captured facts).
2. **The gate** re-validates premises and the lease *at send time and on recovery*
   (authoritative). This is why "closed while deciding" and "second reissue after
   a crash" are caught even if the rules passed earlier — the target's
   `explain()` / `validate_premises` sees the changed world at commit (Req 4.3,
   Req 5.2, Req 6.3).

### Authority as a lease (reusing `approvals.Authority`)

- Policy sends (all rules passed) run under `{"by": "policy", "rules": [...]}`,
  which `Authority.is_live` treats as always live.
- Person-approved sends run under `{"by": <caseworker>, "at": ..., "group":
  "caseworkers"}`. `Authority(approvers, max_age, groups={"caseworkers":[...]},
  clock=...)` checks membership and freshness **at send time**, so a removed or
  expired caseworker is refused (Req 6.1, 6.2).

### Tier choices and recovery behavior

- **Payment rail = tier 1.** `apply` uses `eid` as the Stripe Idempotency-Key, so
  a retry inside the 24h dedup window is exactly-once; `query` lists refunds by
  `eid` for recovery after the window. This is the `Payments.dedup_window =
  24*3600` behavior already in the template.
- **Scheduler and case records = tier 2.** No dedup, but a crash recovers by
  looking up whether the booking/address-change tagged with `eid` landed, so the
  action is never applied twice (gate `_recover_one`, I2).
- No tier-3 civic target: every civic action is at least lookup-able, so recovery
  never has to answer `AMBIGUOUS` purely from the target shape. `AMBIGUOUS` still
  arises only when the gate genuinely cannot confirm (Req 9.4).

## Data models

A **proposal** (built by `CivicOffice`, consumed by `Gate.submit`):

```python
{
  "agent": "civic-office",
  "lease": {"by": "policy", "rules": [...]}  # or a caseworker authority dict
             ,
  "request": {"id": "...", "action": "reissue_payment",
              "case_id": "C-100", "period": "2026-09", "amount": 412},
  "premises": {  # captured from systems of record, never from the model
      "case_id": "C-100", "period": "2026-09",
      "entitlement": 412, "eligible": True, "active": True,
      "prior_reissues": 0, "fraud": False
  },
  "effect": {"case_id": "C-100", "period": "2026-09", "amount": 412}
}
```

Per-action `effect` payloads:

- `reissue_payment` → `{case_id, period, amount}`
- `refund_fee` → `{case_id, fee_id, amount}`
- `book_appointment` → `{case_id, office, slot}`
- `change_address` → `{case_id, new_address}`

SQLite schemas (simulated systems, `backend/civic/`) — minimal columns:

- `residents(id, name)`
- `cases(id, resident_id, eligible, active, address, caseworker, fraud)`
- `entitlements(case_id, period, amount)` — PK `(case_id, period)`
- `ledger(rowid, case_id, period, kind, amount, eid, source, at)` — append-only
- `bookings(rowid, case_id, office, slot, ref, eid, at)`

## Error handling

- **Refusals carry a reason the next reader can act on.** Entitlement refusals
  name the `$412` limit and the facts read (Req 3.2). Duplicate-reissue refusals
  state that a reissue for that `(case, period)` exists (Req 4.4). Status-change
  refusals report `changes` from the target's `explain()` (Req 5.3). These map to
  the gate's `REFUSED:stale_premise` path and the target's `explain` output;
  rule failures map to an `Inbox` escalation whose `why`/`changes`/`repairs` come
  from `escalation.describe()`.
- **Ambiguous outcomes** (crash the gate cannot resolve by retry or lookup) are
  recorded `AMBIGUOUS` and routed to a person via `Inbox.reconcile`, never
  guessed (Req 9.4).
- **Lease failures** at send time return `REFUSED:lease`, refined by
  `Inbox._refine` into `approval_expired` / `approver_removed` where applicable
  (Req 6.2).

## Receipts (reusing `interlock/receipts.py`)

- Every action produces a bundle via `gate.receipt_bundle(proposal, key)` over
  the hash-chained journal entries for its effect id.
- `receipts.verify()` must accept committed and refused receipts and reject any
  that do not chain, are out of order, or overclaim (Req 9.1, 9.2).
- `executed` is `unknown` until a system of record confirms; it is never `true`
  on a crash nobody resolved (Req 9.3, `.kiro/steering/receipts.md`). The
  *lifecycle* progression (`requested → sent → confirmed → recorded → failed`) is
  Spec 2; this spec only guarantees the receipt never overclaims.

## MCP wiring

- `backend/civic_mcp_server.py` — a stdlib MCP server exposing the four actions
  plus the read tools their premises need (entitlement, status, prior reissues,
  address, caseworker). Read tools return data from the systems of record only
  (Req 8.1, 8.4).
- `.kiro/settings/interlock.mcp.json` — proxy config in the format documented in
  `interlock/mcp_proxy.py` (Req 8.2).
- `.kiro/settings/mcp.json` — enable `civic-office-gated` so Kiro's calls are
  gated (Req 8.3).

## Testing strategy

Unit tests (`unittest`, `tests/test_civic_case_actions.py`), run with
`python -m unittest discover -s tests`:

- Entitlement ceiling refusal, including the $4,120-on-$412 case naming the limit (Req 3).
- Duplicate reissue refused, including after a crash/restart (Req 4).
- Eligibility/active re-checked at send time; closed-while-deciding refused with
  the change reported (Req 5).
- Authority lease dead at send time refused (Req 6).
- Large-amount and fraud-flag routing to `caseworkers` with an SLA; unsettled →
  person (Req 7).
- Receipts accepted by `receipts.verify()`; `executed` never `true` without
  confirmation (Req 9).

Property-based tests (`tests/test_civic_properties.py`, Hypothesis dev-only,
skip cleanly when missing per the `HAS_TEMPORAL` pattern):

- **At most one effect** per effect id under any crash schedule and duplicate
  delivery (brief property 1; Req 10.2).
- **Rules hold under concurrency**: any interleaving of assistant and caseworker
  on one `(case, period)` keeps total paid ≤ entitlement (brief property 5;
  Req 10.3).
- **Receipts never overclaim**: for any unconfirmed history, `executed` is never
  `True` (brief property 2; Req 10.4).
- Generated inputs: crash points, assistant/caseworker interleavings, duplicate
  deliveries, and clock jumps across the dedup window and SLAs (Req 10.5).

Compare what PBT finds against the base repo's hand-written 2,000-case fault
sweep and record the result in `KIRO.md` (this comparison/record is a follow-up
noted in the brief; the lifecycle-evidence and ledger-reconciliation properties
belong to Spec 2).
