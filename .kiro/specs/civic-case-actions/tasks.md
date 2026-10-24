# Implementation Plan: civic-case-actions

Every task reuses the existing engine (`interlock/gate.py`,
`interlock/approvals.py`, `interlock/targets/payments.py`) and follows
`.kiro/steering/`. No new state machine. Each task lists the requirements it
satisfies.

- [ ] 1. Scaffold the simulated systems of record under `backend/civic/`
  - [ ] 1.1 Create `backend/civic/case_store.py`: SQLite-backed residents, cases, per-period entitlements, eligibility/active flags, mailing address, assigned caseworker, and fraud flag, with read helpers `entitlement`, `status`, `address`, `caseworker`, `fraud_flagged`. Label the store as simulated in names and any log lines. Inject `clock=`.
    - _Requirements: 2.1, 2.2, 2.5_
  - [ ] 1.2 Create `backend/civic/ledger.py`: append-only payments/refunds with `reissues_for(case_id, period)` and `recorded_total(case_id, period)` that count entries from any source. Label as simulated.
    - _Requirements: 2.1, 2.3, 2.5, 4.2_
  - [ ] 1.3 Create `backend/civic/scheduler_store.py`: SQLite bookings looked up by a reference tied to an effect id. Label as simulated.
    - _Requirements: 2.1, 2.4, 2.5_

- [ ] 2. Build the civic targets in `interlock/targets/civic/`, modeled on `targets/payments.py`
  - [ ] 2.1 Create `payment_rail.py` (tier 1) backing `reissue_payment` and `refund_fee`: `apply` sends a refund using `eid` as the Stripe Idempotency-Key (reuse `Payments(tier=1)` in simulation, `stripe_api` in live/test-key mode), `query` lists by `eid`, and `explain(premises, eid, effect)` returns `{violations, changes, repairs}` over entitlement, eligibility/active, and prior reissues. State it is tier 1 and that the Stripe test PaymentIntent is a stand-in.
    - _Requirements: 1.3, 1.5, 2.6, 3.1, 3.2, 4.1, 4.2, 5.1, 5.3_
  - [ ] 2.2 Create `scheduler.py` (tier 2) backing `book_appointment`: `apply` writes a booking referenced by `eid`, `query` looks it up by that reference, `explain` reports relevant premise changes.
    - _Requirements: 1.4, 1.5, 2.4_
  - [ ] 2.3 Create `case_records.py` (tier 2) backing `change_address`: `apply` writes the new address tagged with `eid`, `query` confirms whether the `eid`-tagged change landed, `explain` reports eligibility/closed or address-changed-elsewhere.
    - _Requirements: 1.4, 1.5, 5.3_

- [ ] 3. Build the `CivicOffice` facade in `backend/civic/office.py`
  - [ ] 3.1 For each action define `effect(request)` and `capture(request)` that reads premises (entitlement, eligible/active, address, caseworker, prior reissues, fraud) from the systems of record, never from the assistant. Derive the effect id from the request via `effect_id_for`.
    - _Requirements: 1.1, 1.2, 8.4_
  - [ ] 3.2 Wire one `Inbox(gate, capture, effect, rules, routes, clock=)` per action family, each over its own `Gate` and target; build proposals as `{agent, lease, premises, effect, request}`. Reuse the engine; add no second decision/state machine.
    - _Requirements: 1.1, 1.6, 7.5_

- [ ] 4. Implement the pre-action rules as `approvals.Rule`
  - [ ] 4.1 `within entitlement`: `request.amount <= facts.entitlement`; failure refuses before send and names the entitlement limit and facts read. Cover the $4,120-on-$412 case.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.5_
  - [ ] 4.2 `at most one reissue per period`: `facts.prior_reissues == 0`, counting all sources from the ledger/rail (including a caseworker by hand).
    - _Requirements: 4.1, 4.2, 4.4, 7.5_
  - [ ] 4.3 `case eligible and active`: `facts.eligible and facts.active`.
    - _Requirements: 5.1, 7.5_

- [ ] 5. Enforce the send-time and recovery checks through the gate (not a bespoke check)
  - [ ] 5.1 Ensure the targets' `validate_premises`/`explain` cause the gate to refuse at commit when eligibility/active changed since decision, reporting the change via `changes`. Add a closed-while-deciding test.
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ] 5.2 Ensure a duplicate reissue is refused after a crash and restart: the one-per-period limit holds through `Gate.recover`/`Inbox.refresh`. Add a crash/restart test.
    - _Requirements: 4.3_
  - [ ] 5.3 Represent the caseworker authority as an `approvals.Authority` lease checked live at dispatch and re-checked on recovery; refuse when expired or the caseworker was removed.
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 6. Routing to a person via `approvals.Route` and `Inbox`
  - [ ] 6.1 Add `large` (amount over a configured limit) and `flagged` (fraud flag) routes to the `caseworkers` group, each with an SLA; verify unanswered escalations move up the chain via `Inbox.tick` with an injected clock.
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ] 6.2 Ensure anything the rules cannot settle goes to a person through `Inbox` rather than running automatically.
    - _Requirements: 7.4_

- [ ] 7. Receipts
  - [ ] 7.1 Produce a receipt bundle via `gate.receipt_bundle` for every action (committed or refused) and confirm `receipts.verify()` accepts it; add a test that `verify()` rejects a tampered/out-of-order bundle.
    - _Requirements: 9.1, 9.2_
  - [ ] 7.2 Confirm `executed` is `unknown` (never `true`) when no system of record confirmed the action, and that an unresolvable crash yields `AMBIGUOUS` routed to a person, never a guess.
    - _Requirements: 9.3, 9.4_

- [ ] 8. MCP exposure
  - [ ] 8.1 Create `backend/civic_mcp_server.py`: a stdlib MCP server exposing the four actions plus the read tools their premises need (entitlement, status, prior reissues, address, caseworker); read tools return systems-of-record data only.
    - _Requirements: 8.1, 8.4_
  - [ ] 8.2 Write `.kiro/settings/interlock.mcp.json` in the format documented in `interlock/mcp_proxy.py`, and enable `civic-office-gated` in `.kiro/settings/mcp.json`.
    - _Requirements: 8.2, 8.3_

- [ ] 9. Unit tests (`tests/test_civic_case_actions.py`, `unittest`)
  - [ ] 9.1 Cover: entitlement ceiling ($4,120 on $412 names the limit); duplicate reissue including after crash/restart; eligibility change at send time with the change reported; dead authority lease refused; large/flagged routing with SLA and unsettled-to-person; receipt acceptance and `executed` never true without confirmation.
    - _Requirements: 1.1, 1.2, 3.3, 4.3, 5.2, 5.4, 6.2, 7.1, 7.2, 7.3, 7.4, 9.1, 9.3_

- [ ] 10. Property-based tests (`tests/test_civic_properties.py`, Hypothesis dev-only)
  - [ ] 10.1 Set up Hypothesis as a dev-only dependency that skips cleanly when missing, following the `HAS_TEMPORAL` pattern in `tests/test_explained.py`.
    - _Requirements: 10.1_
  - [ ] 10.2 Property "at most one effect": for any crash schedule and duplicate delivery, each effect id has at most one committed effect in its target.
    - _Requirements: 10.2, 10.5_
  - [ ] 10.3 Property "rules hold under concurrency": for any interleaving of assistant and caseworker on one `(case, period)`, total paid never exceeds the entitlement.
    - _Requirements: 10.3, 10.5_
  - [ ] 10.4 Property "receipts never overclaim": for any unconfirmed history, the receipt's `executed` is never `True`.
    - _Requirements: 10.4, 10.5_
