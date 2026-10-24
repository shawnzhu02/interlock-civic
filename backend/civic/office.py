"""
``CivicOffice``: the thin domain facade for the Riverside County Benefits Office.

It turns an action call into a gate proposal and owns the ``Inbox`` wiring. It
does **not** re-implement decisions: the pre-action rules, routing, person
queue, dispatch, premise re-validation, lease checks, crash recovery, and
receipts all come from the engine (``interlock/approvals.py`` and
``interlock/gate.py``). There is no second state machine.

One ``Inbox`` per action family, each over its own ``Gate`` and target:

    payments      reissue_payment + refund_fee   -> PaymentRail  (tier 1)
    scheduler     book_appointment               -> Scheduler    (tier 2)
    case_records  change_address                 -> CaseRecords  (tier 2)

For each action the facade defines ``effect(request)`` (the target payload) and
``capture(request)`` (the premises, read from the systems of record, never from
the assistant). The effect id is derived from the request via ``effect_id_for``
inside the engine (the ``Inbox`` keys every chain on ``request["id"]``).

The four facts a receipt reports, and the rules themselves, live in the engine
and in ``interlock/targets/civic/``; this file only wires them together. Time is
injected via ``clock=`` (see ``.kiro/steering/tech.md``).
"""
import os
import time

from interlock.approvals import Authority, Inbox, Route, Rule
from interlock.gate import Gate
from interlock.targets.civic import CaseRecords, PaymentRail, Scheduler

from .case_store import CaseStore
from .ledger import Ledger
from .scheduler_store import SchedulerStore

PAYMENT_ACTIONS = ("reissue_payment", "refund_fee")
SCHEDULER_ACTIONS = ("book_appointment",)
CASE_RECORD_ACTIONS = ("change_address",)

# Routing to a person: amounts over this limit go to the caseworkers group.
LARGE_AMOUNT = 1000
CASEWORKER_SLA = 4 * 3600


# --- the pre-action rules (Task 4, reusing approvals.Rule) ------------------
#
# Each rule is a named check over the request and the facts captured for it
# (``check(request, facts) -> bool``). False sends the request to a person via
# the Inbox. The facts a rule reads are exactly the premises the effect carries
# (Req 7.5), so the gate re-validates the same facts at send time and recovery.
#
# | rule name                        | check                                 | req |
# | within entitlement               | request.amount <= facts.entitlement   | 3   |
# | at most one reissue per period   | facts.prior_reissues == 0 (any source)| 4   |
# | case eligible and active         | facts.eligible and facts.active       | 5   |
#
# When a rule fails, the escalation records the failed rule name in ``detail``
# and the captured facts in ``facts`` (so an entitlement refusal names the
# entitlement limit it hit and the facts read: Req 3.2, 3.3).


def within_entitlement(request, facts):
    """Req 3: the reissue/refund amount must not exceed the case's entitlement for the period."""
    entitlement = facts.get("entitlement")
    return entitlement is not None and request["amount"] <= entitlement


def at_most_one_reissue(request, facts):
    """
    Req 4: at most one reissue per case and period. ``prior_reissues`` is counted
    from the ledger across every source (including a caseworker acting by hand),
    and is 0 for a fee refund (which has no period), so the check passes for it.
    """
    return facts.get("prior_reissues", 0) == 0


def eligible_and_active(request, facts):
    """Req 5: the case must be eligible and active."""
    return bool(facts.get("eligible")) and bool(facts.get("active"))


PAYMENT_RULES = [
    Rule("within entitlement", within_entitlement),
    Rule("at most one reissue per period", at_most_one_reissue),
    Rule("case eligible and active", eligible_and_active),
]

STATUS_RULES = [
    Rule("case eligible and active", eligible_and_active),
]


class CivicOffice:
    def __init__(self, directory, caseworkers=("ana", "ben"), clock=time.time,
                 payment_backend=None, large_amount=LARGE_AMOUNT, sla=CASEWORKER_SLA):
        os.makedirs(directory, exist_ok=True)
        self.directory = directory
        self.clock = clock
        self.large_amount = large_amount
        self.sla = sla

        # Simulated systems of record.
        self.case_store = CaseStore(os.path.join(directory, "case.db"), clock=clock)
        self.ledger = Ledger(os.path.join(directory, "ledger.db"), clock=clock)
        self.scheduler_store = SchedulerStore(os.path.join(directory, "scheduler.db"), clock=clock)

        # One lease store (authority) shared across families: members and
        # freshness are read live, so a removed or expired caseworker fails closed.
        self.authority = Authority(groups={"caseworkers": list(caseworkers)},
                                   max_age=self.sla, clock=clock)

        # The targets.
        self.payment_rail = PaymentRail(self.case_store, self.ledger, backend=payment_backend)
        self.scheduler = Scheduler(self.case_store, self.scheduler_store)
        self.case_records = CaseRecords(self.case_store)

        routes = self._routes()

        # One Inbox per action family, each over its own Gate and target.
        self.payments = Inbox(
            self._gate(self.payment_rail, "payments"),
            capture=self.capture, effect=self.effect, rules=PAYMENT_RULES,
            routes=routes, clock=clock, name="civic-office:payments")
        self.scheduling = Inbox(
            self._gate(self.scheduler, "scheduler"),
            capture=self.capture, effect=self.effect, rules=STATUS_RULES,
            routes=routes, clock=clock, name="civic-office:scheduler")
        self.records = Inbox(
            self._gate(self.case_records, "case_records"),
            capture=self.capture, effect=self.effect, rules=STATUS_RULES,
            routes=routes, clock=clock, name="civic-office:case_records")

    # --- wiring helpers -----------------------------------------------------

    def _gate(self, target, name):
        return Gate(target, os.path.join(self.directory, f"{name}.jsonl"), self.authority)

    def _routes(self):
        """First match wins. Large amounts and fraud-flagged cases go to caseworkers with an SLA."""
        return [
            Route("large", ["caseworkers"],
                  when=lambda item: (item["request"].get("amount") or 0) > self.large_amount,
                  sla=self.sla),
            Route("flagged", ["caseworkers"],
                  when=lambda item: bool(item.get("facts", {}).get("fraud")),
                  sla=self.sla),
            Route("default", ["caseworkers"], sla=self.sla),
        ]

    def inbox_for(self, action):
        if action in PAYMENT_ACTIONS:
            return self.payments
        if action in SCHEDULER_ACTIONS:
            return self.scheduling
        if action in CASE_RECORD_ACTIONS:
            return self.records
        raise ValueError(f"unknown civic action {action!r}")

    # --- per-action effect and capture (Task 3.1) ---------------------------

    def effect(self, request):
        """The target payload for a request. Never carries facts the model supplied."""
        action = request["action"]
        if action == "reissue_payment":
            return {"case_id": request["case_id"], "period": request["period"],
                    "amount": request["amount"]}
        if action == "refund_fee":
            return {"case_id": request["case_id"], "fee_id": request["fee_id"],
                    "amount": request["amount"]}
        if action == "book_appointment":
            return {"case_id": request["case_id"], "office": request["office"],
                    "slot": request["slot"]}
        if action == "change_address":
            return {"case_id": request["case_id"], "new_address": request["new_address"]}
        raise ValueError(f"unknown civic action {action!r}")

    def capture(self, request):
        """
        Read the premises the decision depends on from the systems of record
        (case store for entitlement/eligibility/address/caseworker/fraud, ledger
        for prior reissues). This is what makes the premises independent of the
        assistant (Req 7.5, Req 8.4).
        """
        action, case_id = request["action"], request["case_id"]
        status = self.case_store.status(case_id)
        facts = {
            "case_id": case_id,
            "eligible": status["eligible"],
            "active": status["active"],
            "fraud": self.case_store.fraud_flagged(case_id),
            "caseworker": self.case_store.caseworker(case_id),
        }
        if action == "reissue_payment":
            period = request["period"]
            facts["period"] = period
            facts["entitlement"] = self.case_store.entitlement(case_id, period)
            facts["prior_reissues"] = self.payment_rail.prior_reissues(case_id, period)
        elif action == "refund_fee":
            # A fee refund has no period; the entitlement ceiling still applies.
            period = request.get("period")
            facts["period"] = period
            facts["entitlement"] = (self.case_store.entitlement(case_id, period)
                                    if period is not None else request.get("fee_amount"))
            facts["prior_reissues"] = 0
        elif action == "change_address":
            facts["prior_address_changes"] = self.case_store.address_changes_since(case_id, None)
        return facts

    # --- the action entry points --------------------------------------------

    def submit(self, request):
        """Submit a civic action request through its family's Inbox and the gate."""
        return self.inbox_for(request["action"]).submit(request)
