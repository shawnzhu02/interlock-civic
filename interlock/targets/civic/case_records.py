"""
EffectTarget: the case system's mailing address. **Tier 2.**

Backs ``change_address``. Tier 2 means no server-side dedup, but the address
change is written tagged with its effect id, so recovery can look up whether the
eid-tagged change landed and never apply it twice (gate ``_recover_one``, I2).

Effect payload: ``{case_id, new_address}``. Premises captured:
``{case_id, eligible, active, prior_address_changes}``.
``explain(premises, eid, effect)`` reports whether the case became
ineligible/closed, or the address was changed elsewhere since the decision.
Writes go to the SIMULATED case system in ``backend/civic/case_store.py``.
"""
from ...escalation import diff


class CaseRecords:
    tier = 2
    queryable = True

    def __init__(self, case_store):
        self.case_store = case_store

    # --- premises -----------------------------------------------------------

    def capture(self, case_id):
        status = self.case_store.status(case_id)
        return {
            "case_id": case_id,
            "eligible": status["eligible"],
            "active": status["active"],
            "prior_address_changes": self.case_store.address_changes_since(case_id, None),
        }

    def _now(self, premises, eid):
        case_id = premises["case_id"]
        status = self.case_store.status(case_id)
        return {
            "case_id": case_id,
            "eligible": status["eligible"],
            "active": status["active"],
            "prior_address_changes": self.case_store.address_changes_since(case_id, eid),
        }

    def validate_premises(self, premises, eid=None):
        now = self._now(premises, eid)
        violations = []
        if now["eligible"] != premises["eligible"]:
            violations.append("eligibility changed")
        if now["active"] != premises["active"]:
            violations.append("active status changed")
        if now["prior_address_changes"] != premises.get("prior_address_changes",
                                                         now["prior_address_changes"]):
            violations.append("address changed elsewhere since decision")
        return violations

    def explain(self, premises, eid=None, effect=None):
        violations = self.validate_premises(premises, eid)
        if not violations:
            return {"violations": [], "changes": [], "repairs": []}
        now = self._now(premises, eid)
        fields = ("eligible", "active", "prior_address_changes")
        seen = {k: premises.get(k) for k in fields}
        current = {k: now[k] for k in fields}
        return {"violations": violations, "changes": diff(seen, current), "repairs": []}

    # --- effect -------------------------------------------------------------

    def apply(self, eid, effect, crash_after_effect=False):
        from ...gate import SimulatedCrash
        self.case_store.set_address(effect["case_id"], effect["new_address"],
                                    eid=eid, source="gate")
        if crash_after_effect:
            raise SimulatedCrash(eid)               # change written, ack lost
        return {"status": "ok"}

    def query(self, eid, effect):
        return self.case_store.address_change_by_eid(eid) is not None
