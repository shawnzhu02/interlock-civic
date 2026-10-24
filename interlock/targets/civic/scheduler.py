"""
EffectTarget: the appointment scheduler. **Tier 2.**

Backs ``book_appointment``. Tier 2 means no server-side dedup, but a booking is
written with a reference tied to its effect id, so recovery after a crash can
look it up and never book twice (gate ``_recover_one``, I2).

Effect payload: ``{case_id, office, slot}``. Premises captured:
``{case_id, eligible, active}``.  ``explain(premises, eid, effect)`` reports
eligibility/active changes since the decision. Writes go to the SIMULATED
scheduler in ``backend/civic/scheduler_store.py``.
"""
from ...escalation import diff


class Scheduler:
    tier = 2
    queryable = True

    def __init__(self, case_store, scheduler_store):
        self.case_store = case_store
        self.store = scheduler_store

    # --- premises -----------------------------------------------------------

    def capture(self, case_id):
        status = self.case_store.status(case_id)
        return {"case_id": case_id, "eligible": status["eligible"], "active": status["active"]}

    def _now(self, premises):
        status = self.case_store.status(premises["case_id"])
        return {"case_id": premises["case_id"], "eligible": status["eligible"], "active": status["active"]}

    def validate_premises(self, premises, eid=None):
        now = self._now(premises)
        violations = []
        if now["eligible"] != premises["eligible"]:
            violations.append("eligibility changed")
        if now["active"] != premises["active"]:
            violations.append("active status changed")
        return violations

    def explain(self, premises, eid=None, effect=None):
        violations = self.validate_premises(premises, eid)
        if not violations:
            return {"violations": [], "changes": [], "repairs": []}
        now = self._now(premises)
        fields = ("eligible", "active")
        seen = {k: premises.get(k) for k in fields}
        current = {k: now[k] for k in fields}
        return {"violations": violations, "changes": diff(seen, current), "repairs": []}

    # --- effect -------------------------------------------------------------

    def apply(self, eid, effect, crash_after_effect=False):
        from ...gate import SimulatedCrash
        ref = self.store.book(effect["case_id"], effect["office"], effect["slot"], eid)
        if crash_after_effect:
            raise SimulatedCrash(eid)               # booking written, ack lost
        return {"status": "ok", "ref": ref}

    def query(self, eid, effect):
        return self.store.by_eid(eid) is not None
