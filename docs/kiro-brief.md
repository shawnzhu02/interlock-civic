# Build brief for Kiro

This brief is the input to Kiro's spec flow. It covers three specs. For each one, start a new spec in Kiro and paste that section as the feature description. Let Kiro write `requirements.md`, `design.md` and `tasks.md` under `.kiro/specs/<name>/`. Review each file, edit it, and only then run the tasks.

The steering docs in `.kiro/steering/` already hold the product, the tech rules, the module map, and the receipt rules. The specs should reference those docs, not repeat them.

---

## Spec 1: `civic-case-actions`

**Goal.** Four civic actions that an AI assistant can take on a resident's case at the fictional Riverside County Benefits Office. Each action goes through the Interlock gate, and fixed rules decide whether it was the right action before it runs.

**The actions:**

| action | system it changes | tier |
|---|---|---|
| `reissue_payment(case_id, period, amount)` | payment rail (Stripe test mode) | 1: Stripe dedupes on Idempotency-Key, and refunds and payouts can be looked up |
| `refund_fee(case_id, fee_id, amount)` | payment rail (Stripe test mode) | 1 |
| `book_appointment(case_id, office, slot)` | appointment scheduler (simulated, SQLite) | 2: no dedup, but a booking can be looked up by reference |
| `change_address(case_id, new_address)` | case system (simulated, SQLite) | 2 |

**The payment rail is a stand-in.** Real benefit payments go out by ACH or EBT, and Stripe test mode has neither without Connect. In the demo, each resident has a test PaymentIntent that stands for the account they are paid into, and a reissue is a Stripe refund against it. This gives real Stripe behavior, including dedup, lookup, webhooks, and late failure through test card `4000 0000 0000 5126`. Say so in the README and the UI.

**The simulated systems** are the case system, the ledger, and the scheduler, in `backend/civic/`, SQLite only. Every name, page, and log line labels them as simulated.
- The case system holds: residents, cases, entitlements per period, eligibility status, the mailing address, and the assigned caseworker.
- The ledger is an append-only list of payments and refunds the office has recorded.

**The pre-action rules** reuse `approvals.Rule`, `Route`, `Authority` and `Inbox`. Each rule names the facts it read, so they become the effect's premises.
- The amount may not exceed the case's entitlement for that period.
- At most one reissue per case and period, counting reissues by any source, including a caseworker acting by hand.
- The case must be eligible and active when the action is sent, not only when it was decided.
- The caseworker's authority lease must be live at send time.
- Amounts over a set limit, or cases with a fraud flag, are routed to the `caseworkers` group with an SLA. Anything the rules cannot settle goes to a person.

**MCP.** Expose the four actions, plus the read tools their premises need, as a standard-library MCP server in `backend/civic_mcp_server.py`. Write the matching proxy config at `.kiro/settings/interlock.mcp.json`, in the format documented in `interlock/mcp_proxy.py`. Then enable `civic-office-gated` in `.kiro/settings/mcp.json`. Kiro's own calls to the office then go through the gate.

**Acceptance criteria:**
- A $4,120 reissue on a $412 entitlement is refused before anything is sent. The refusal says what limit it hit.
- A second reissue for the same case and period is refused, even when it comes after a crash and restart.
- A case closed by a caseworker while the assistant was deciding is refused at send time, and the refusal says what changed.
- Every action has a receipt that `receipts.verify()` accepts.

---

## Spec 2: `outcome-tracking`

**Goal.** After an action is sent, confirm that it actually happened in every system it touches, and keep watching. This is the "did it happen?" half of the pitch.

**Lifecycle.** An action moves through `requested`, `sent`, `confirmed`, `recorded`, or ends in `failed`. See `.kiro/steering/receipts.md`.
- `confirmed` comes from the payment rail: a signed Stripe webhook through `confirm.confirm_event`, or a lookup through `confirm.confirm_by_lookup`.
- `recorded` comes from the ledger: an entry matching the case, the amount, and the effect id.
- A late failure moves a confirmed action to `failed` and reopens the case. The Stripe test card `4000 0000 0000 5126` makes a refund fail after it succeeds.
- A reconciler runs on a schedule with an injected clock. It finds actions that are stuck (sent but never confirmed after N hours, or confirmed but never recorded) and puts each one in the caseworker queue with the evidence.

**Hold the "done" message.** The assistant's reply to the resident goes through `hold_reply(effect_id, draft)`. It returns the draft only once the receipt is `confirmed` or later. Before that, it returns a plain-language status, for example "Your payment was sent. The bank has not confirmed it yet."

**Acceptance criteria:**
- The pitch's story runs end to end on Stripe test mode. The assistant reissues a payment, Stripe reports the refund `failed`, the case reopens, and the resident's page changes from "sent" to "failed, a caseworker will contact you by <date>".
- No page shows a state that is ahead of its evidence.
- A crash between "sent" and "confirmed" recovers to the right state by lookup. It never sends the action twice.

---

## Spec 3: `caseworker-console`

**Goal.** The web UI that judges and users see. It is served by `backend/api.py`, uses static HTML, and has no build step.

**Pages:**
- **Caseworker queue.** Only the cases that need a person. Each shows the reason, what changed (`escalation.describe()`), the facts at decision time against the facts now, the suggested fix, and buttons to approve, repair, or close. A decision is checked again at send time.
- **Resident status page.** One case, in plain language, at about a grade-6 reading level. It says where each action stands, what happens next, and when. It must work on a phone and meet WCAG 2.2 AA.
- **Receipt view.** The four facts, the lifecycle timeline, and a "Verify" button that runs `receipts.verify()` and shows the result.
- **Live demo.** A one-click run of the pitch's story against Stripe test mode, with the without-Interlock and with-Interlock versions side by side. Reuse the pattern in `demo/standalone.html` and `backend/standalone.py`.

**Acceptance criteria:**
- Every page has keyboard access and visible focus, and passes axe-core with no serious issues.
- With no Stripe key set, the pages still load. The live demo says which key is missing, and offers a separate demo button clearly labeled as simulated.
- Deployed with a public test link, which goes in the README.

---

## Property-based tests (Hypothesis, dev-only)

Turn PBT on for these requirements. Generate the inputs: crash points, event orders, duplicate deliveries, late failures, and clock jumps.

1. **At most one effect.** For any crash schedule and any duplicate delivery, each effect id has at most one committed effect in the target.
2. **Receipts never overclaim.** For any history, if no system confirmed the action, the receipt's `executed` is never `True`.
3. **The ledger matches the rail.** After reconciliation, the ledger total for a case equals the confirmed payments minus confirmed failures on the payment rail.
4. **The lifecycle only moves on evidence.** For any order of webhook events, including out-of-order and repeated ones, no action reaches a state without the evidence that state requires.
5. **The rules hold under concurrency.** For any interleaving of the assistant and a caseworker acting on the same case, the total paid for a period never exceeds the entitlement.

The base repo already has a hand-written randomized fault sweep with 2,000 cases. Compare what PBT finds against it, and record the result in `KIRO.md`.

---

## Experiment

Adapt `experiments/approval_inbox.py` into `experiments/benefits_inbox.py`: a synthetic day of 100 benefit-case actions. State the mix as an assumption. Compare three setups: everyone approves by hand, rules only, and rules plus Interlock. Report reviews done by a person, wrong payments, and silent failures caught. Add it to `run_all.py` so CI checks it.
