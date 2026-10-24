# Requirements: civic-case-actions

## Introduction

Four civic actions that an AI assistant can take on a resident's case at the
fictional Riverside County Benefits Office, each routed through the Interlock
gate so fixed, pre-action rules decide whether it is the right action *before*
it runs. This spec covers the "was it the right action?" half of the product
(see `.kiro/steering/product.md`). Outcome tracking ("did it happen?") is
Spec 2.

The four actions:

| action | system it changes | tier |
|---|---|---|
| `reissue_payment(case_id, period, amount)` | payment rail (Stripe test mode) | 1 |
| `refund_fee(case_id, fee_id, amount)` | payment rail (Stripe test mode) | 1 |
| `book_appointment(case_id, office, slot)` | appointment scheduler (simulated, SQLite) | 2 |
| `change_address(case_id, new_address)` | case system (simulated, SQLite) | 2 |

This spec reuses the engine rather than adding a second state machine: the gate
(`interlock/gate.py`), the pre-action rules and person queue
(`interlock/approvals.py`: `Rule`, `Route`, `Authority`, `Inbox`), and the
tier/premise pattern of `interlock/targets/payments.py`. Tech constraints are in
`.kiro/steering/tech.md` (standard library only at runtime, Python 3.9, Stripe
test keys only, injected clock). Structure and conventions are in
`.kiro/steering/structure.md` (one target per system in `interlock/targets/`,
simulated systems in `backend/civic/`, effect ids from the approved request).

The payment rail is a stand-in: each resident has a Stripe test-mode
PaymentIntent that stands for the account they are paid into, and a reissue is a
Stripe refund against it. This is labeled as a stand-in in the README and UI.
The case system, ledger, and scheduler are simulated (SQLite), labeled as
simulated everywhere they appear.

## Requirements

### Requirement 1: Four gated civic actions

**User Story:** As an AI assistant acting on a resident's case, I want each of
the four civic actions to run through the Interlock gate, so that an action only
reaches a system of record after the fixed rules and the gate's checks pass.

#### Acceptance Criteria

1. WHEN an assistant invokes `reissue_payment`, `refund_fee`, `book_appointment`, or `change_address` THEN the action SHALL be submitted as a gate proposal carrying `agent`, `lease`, `premises`, `effect`, and `request`, and SHALL NOT reach any system of record except through `Gate.submit`.
2. WHEN a proposal is built THEN its effect id SHALL be derived from the approved request via `effect_id_for`, and SHALL NOT be supplied by the model.
3. WHEN an effect targets the payment rail THEN the target SHALL be a tier-1 target (dedupes on the effect id as Stripe's Idempotency-Key, and refunds/payouts can be looked up).
4. WHEN an effect targets the appointment scheduler or the case system THEN the target SHALL be a tier-2 target (no dedup, but the written record can be looked up by effect id).
5. WHEN a civic target reports a premise violation THEN it SHALL do so through an `explain(premises, eid, effect)` method that returns `violations`, `changes`, and `repairs`, following the `interlock/targets/payments.py` pattern.
6. WHEN each civic action runs THEN it SHALL reuse the engine's `Gate`, `Rule`, `Route`, `Authority`, and `Inbox` rather than introducing a second decision or state machine.

### Requirement 2: Simulated systems of record

**User Story:** As the agency, I want the case system, ledger, and scheduler to
be realistic but clearly simulated, so that the demo exercises real lookup and
recording behavior without touching a real agency system.

#### Acceptance Criteria

1. WHEN the simulated systems are created THEN they SHALL live under `backend/civic/` and SHALL use SQLite only (no runtime dependency beyond the standard library).
2. WHEN the case system is queried THEN it SHALL hold residents, cases, per-period entitlements, eligibility status (eligible/active flags), the mailing address, and the assigned caseworker.
3. WHEN the ledger is read THEN it SHALL be an append-only list of payments and refunds the office has recorded.
4. WHEN the scheduler is used THEN a booking SHALL be lookup-able by a reference tied to its effect id.
5. WHEN any simulated system is shown in a name, a page, or a log line THEN it SHALL be labeled as simulated.
6. WHEN the payment rail is described in the README or UI THEN it SHALL state that the Stripe test-mode PaymentIntent is a stand-in for the resident's real payment account.

### Requirement 3: Entitlement ceiling rule

**User Story:** As a caseworker, I want an amount that exceeds the case's
entitlement for that period to be refused before anything is sent, so that an
over-payment never reaches the rail.

#### Acceptance Criteria

1. WHEN a `reissue_payment` or `refund_fee` amount exceeds the case's entitlement for the named period THEN the action SHALL be refused before any effect is sent.
2. WHEN the action is refused for exceeding the entitlement THEN the refusal SHALL name the limit it hit (the entitlement amount for that period) and the facts it read.
3. WHEN a $4,120 reissue is submitted against a $412 entitlement THEN it SHALL be refused before anything is sent, and the refusal SHALL state the $412 limit.
4. WHEN the amount is within the entitlement THEN the entitlement rule SHALL NOT block the action.

### Requirement 4: One reissue per case and period

**User Story:** As the agency, I want at most one reissue per case and period,
counting every source, so that a missed payment is never reissued twice.

#### Acceptance Criteria

1. WHEN a reissue is requested for a case and period that already has a reissue recorded THEN the action SHALL be refused.
2. WHEN counting prior reissues THEN the count SHALL include reissues from any source, including a caseworker acting by hand, read from the ledger / payment rail rather than from the assistant's own record.
3. WHEN a second reissue for the same case and period is submitted after a crash and restart THEN it SHALL still be refused (the one-per-period limit survives recovery and is enforced at send time).
4. WHEN the refusal is for a duplicate reissue THEN it SHALL state that a reissue for that case and period already exists.

### Requirement 5: Eligibility and active status checked at send time

**User Story:** As a caseworker, I want the case to be eligible and active when
the action is actually sent, not only when it was decided, so that a case closed
during deliberation does not get paid.

#### Acceptance Criteria

1. WHEN an action is sent THEN the case SHALL be re-checked as eligible and active against the case system at send time, not only at decision time, through the gate's premise re-validation.
2. WHEN a case was eligible at decision time but closed or made ineligible before send THEN the action SHALL be refused at send time.
3. WHEN an action is refused for a status change THEN the refusal SHALL say what changed, from what value to what value, using the target's `explain()` output (`changes`).
4. WHEN a case is closed by a caseworker while the assistant was deciding THEN sending SHALL be refused and the refusal SHALL report the eligibility/active change.

### Requirement 6: Live caseworker authority lease

**User Story:** As the agency, I want the caseworker's authority to be a live
lease at the moment of sending, so that a removed or expired authority cannot
move money.

#### Acceptance Criteria

1. WHEN an action is sent THEN the caseworker's authority SHALL be represented as a lease and SHALL be checked as live at dispatch, reusing the engine's lease check (`Authority` / `Gate._lease_seen`).
2. WHEN the authority lease is not live at send time (expired, or the caseworker was removed) THEN the action SHALL be refused.
3. WHEN recovery re-sends or re-checks an in-flight action THEN it SHALL re-check the same lease before any resend, consistent with the gate's recovery contract.

### Requirement 7: Routing amounts over a limit and flagged cases to a person

**User Story:** As a caseworker, I want large amounts and fraud-flagged cases to
reach a person with an SLA, and anything the rules cannot settle to reach a
person, so that no uncertain action runs automatically.

#### Acceptance Criteria

1. WHEN an action's amount is over a configured limit THEN it SHALL be routed to the `caseworkers` group rather than sent automatically.
2. WHEN a case carries a fraud flag THEN the action SHALL be routed to the `caseworkers` group.
3. WHEN an action is routed to the `caseworkers` group THEN the route SHALL carry an SLA, and an unanswered escalation SHALL move up its route chain after the SLA, reusing `Route` and `Inbox.tick`.
4. WHEN the rules cannot settle an action THEN it SHALL go to a person via `Inbox` rather than run automatically.
5. WHEN each pre-action rule runs THEN it SHALL name the facts it read, and those facts SHALL become the effect's premises.

### Requirement 8: MCP exposure of the four actions and their read tools

**User Story:** As a developer wiring up Kiro, I want the four actions and the
read tools their premises need exposed as an MCP server behind the gate, so that
Kiro's own calls to the office go through Interlock.

#### Acceptance Criteria

1. WHEN the office is exposed over MCP THEN a standard-library MCP server SHALL be provided at `backend/civic_mcp_server.py` exposing the four actions plus the read tools their premises need (for example: read entitlement, eligibility/active status, prior reissues, mailing address, assigned caseworker).
2. WHEN the proxy is configured THEN a matching proxy config SHALL be written at `.kiro/settings/interlock.mcp.json` in the format documented in `interlock/mcp_proxy.py`.
3. WHEN the gate proxy is enabled THEN `civic-office-gated` SHALL be enabled in `.kiro/settings/mcp.json`, so Kiro's calls to the office pass through the gate.
4. WHEN a read tool is called THEN it SHALL return data from a system of record (the case system, ledger, or rail) and SHALL NOT trust the assistant's account of what happened.

### Requirement 9: Verifiable receipts

**User Story:** As an auditor, I want every action to produce a receipt that
`receipts.verify()` accepts, so that what happened can be checked without
reconciling logs.

#### Acceptance Criteria

1. WHEN any of the four actions is submitted (committed or refused) THEN it SHALL produce a receipt bundle via `gate.receipt_bundle`, hash-chained over the effect's journal entries.
2. WHEN a receipt is verified THEN `receipts.verify()` SHALL accept it, and SHALL reject any receipt whose entries do not chain, are out of order, or claim a state the entries do not support (per `.kiro/steering/receipts.md`).
3. WHEN no system of record has confirmed an action THEN the receipt's `executed` SHALL be `unknown` and never `true`.
4. WHEN it is unclear whether an action landed THEN the outcome SHALL be `AMBIGUOUS` and routed to a person, never guessed, per the non-negotiable product rules.

### Requirement 10: Correctness under crash, concurrency, and duplicate delivery (property-based)

**User Story:** As an engineer, I want the actions' guarantees checked under
crash schedules, event orders, duplicate deliveries, and clock jumps, so that
the invariants hold beyond the hand-written example cases. These properties are
drawn from the "Property-based tests" section of `docs/kiro-brief.md`; only the
ones that apply to this spec (pre-action correctness and at-most-one effect) are
in scope here. Lifecycle-evidence and ledger-reconciliation properties belong to
Spec 2.

#### Acceptance Criteria

1. WHEN tests use property-based testing THEN they SHALL use Hypothesis as a dev-only dependency and SHALL skip cleanly when it is missing, following the `HAS_TEMPORAL` pattern in `tests/test_explained.py`.
2. WHEN any crash schedule and any duplicate delivery are generated for a civic effect THEN each effect id SHALL have at most one committed effect in its target (brief property 1, "at most one effect").
3. WHEN the assistant and a caseworker act on the same case in any interleaving THEN the total paid for a period SHALL never exceed that period's entitlement (brief property 5, "the rules hold under concurrency").
4. WHEN any history is generated in which no system confirmed the action THEN the receipt's `executed` SHALL never be `True` (brief property 2, "receipts never overclaim").
5. WHEN property-based tests run THEN they SHALL generate the fault inputs named in the brief that apply here: crash points, interleavings of assistant and caseworker, duplicate deliveries, and clock jumps affecting the dedup window and SLAs.
