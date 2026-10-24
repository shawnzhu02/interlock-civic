"""
EffectTarget: the payment rail for reissues and fee refunds. **Tier 1.**

The payment rail is the one real system in the civic demo: a reissue or a fee
refund is a Stripe refund (test mode) against the resident's test-mode
PaymentIntent, which is a *stand-in* for the account the resident is paid into
(stated in the README and UI). In simulation it reuses
``interlock/targets/payments.py`` (``Payments(tier=1)``); in live/test-key mode
it uses ``interlock/targets/stripe_api.py``.

Tier 1 means: ``apply`` sends with ``eid`` as the Stripe Idempotency-Key, so a
retry inside the dedup window is exactly-once, and ``query`` lists refunds by
``eid`` for recovery after the window (the gate falls back to tier 2 then). The
Stripe test PaymentIntent is a stand-in for the resident's real payment account.

Premises captured (read from the systems of record, never from the assistant):

    {case_id, period, entitlement, eligible, active, prior_reissues, fraud}

``explain(premises, eid, effect)`` returns ``{violations, changes, repairs}`` over
entitlement, eligibility/active, and prior reissues, following the
``payments.py`` pattern. Domain wording for refusals lives here.
"""
from ...escalation import diff
from ..payments import Payments


class PaymentRail:
    tier = 1
    queryable = True
    dedup_window = 24 * 3600            # Stripe prunes idempotency keys after 24h

    def __init__(self, case_store, ledger, backend=None):
        """
        ``case_store`` and ``ledger`` are the simulated systems of record the
        premises are re-read from. ``backend`` sends the money: a ``Payments(tier=1)``
        in simulation (the default), or a ``StripeRefunds`` in live/test-key mode.
        Both expose ``apply(eid, effect, crash_after_effect)`` and ``query(eid, effect)``.
        """
        self.case_store = case_store
        self.ledger = ledger
        self.backend = backend if backend is not None else Payments(tier=1)

    # --- premises -----------------------------------------------------------

    def capture(self, case_id, period):
        """The facts a reissue/refund decision depends on, read from the systems of record."""
        status = self.case_store.status(case_id)
        return {
            "case_id": case_id,
            "period": period,
            "entitlement": self.case_store.entitlement(case_id, period),
            "eligible": status["eligible"],
            "active": status["active"],
            "prior_reissues": self.ledger.reissues_for(case_id, period),
            "fraud": self.case_store.fraud_flagged(case_id),
        }

    def _now(self, premises, eid):
        """Re-read the same premises now, counting prior reissues from sources other than this effect."""
        case_id, period = premises["case_id"], premises["period"]
        status = self.case_store.status(case_id)
        prior = sum(1 for e in self.ledger.entries(case_id, period)
                    if e["kind"] == "reissue" and e.get("eid") != eid)
        return {
            "case_id": case_id,
            "period": period,
            "entitlement": self.case_store.entitlement(case_id, period),
            "eligible": status["eligible"],
            "active": status["active"],
            "prior_reissues": prior,
            "fraud": self.case_store.fraud_flagged(case_id),
        }

    def validate_premises(self, premises, eid=None):
        now = self._now(premises, eid)
        violations = []
        if now["entitlement"] != premises["entitlement"]:
            violations.append("entitlement changed")
        if now["eligible"] != premises["eligible"]:
            violations.append("eligibility changed")
        if now["active"] != premises["active"]:
            violations.append("active status changed")
        if now["prior_reissues"] != premises.get("prior_reissues", now["prior_reissues"]):
            violations.append("reissued elsewhere since decision")
        return violations

    def explain(self, premises, eid=None, effect=None):
        """What changed since the decision, in words a caseworker can act on. Violations come from validate_premises."""
        violations = self.validate_premises(premises, eid)
        if not violations:
            return {"violations": [], "changes": [], "repairs": []}
        now = self._now(premises, eid)
        fields = ("entitlement", "eligible", "active", "prior_reissues")
        seen = {k: premises.get(k) for k in fields}
        current = {k: now[k] for k in fields}
        return {"violations": violations, "changes": diff(seen, current), "repairs": []}

    # --- effect -------------------------------------------------------------

    def apply(self, eid, effect, crash_after_effect=False):
        # The backend (Payments / StripeRefunds) raises SimulatedCrash itself when asked.
        return self.backend.apply(eid, effect, crash_after_effect)

    def query(self, eid, effect):
        return self.backend.query(eid, effect)
