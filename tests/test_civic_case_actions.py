"""
Scenario tests for the civic-case-actions demo (spec task 9.1).

These assert the six story outcomes a-f produced by the REAL engine through
``CivicOffice`` (simulated case system/ledger/scheduler, simulated tier-1
payment rail; no network, no Stripe key), and the two non-negotiable receipt
properties: every receipt verifies, and none claims ``executed`` is ``True``
without a confirmation. Standard library ``unittest`` only; a fixed clock and a
fresh temp directory per test keep them deterministic.
"""
import os
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from backend.civic.office import CivicOffice
from interlock.gate import SimulatedCrash
from interlock.journal import effect_id_for
from interlock.receipts import verify

START = 1_700_000_000


class Clock:
    def __init__(self, start=START):
        self.t = float(start)

    def __call__(self):
        return self.t

    def tick(self, seconds=1):
        self.t += seconds
        return self.t


class CivicScenarioTest(unittest.TestCase):
    def setUp(self):
        self._dir = tempfile.TemporaryDirectory(prefix="civic-test-")
        self.addCleanup(self._dir.cleanup)
        self.clock = Clock()
        self.office = CivicOffice(self._dir.name, clock=self.clock)
        self.case_id, self.period = "case-7001", "2026-09"
        self.office.case_store.add_resident("res-maria", "Maria (simulated)")
        self.office.case_store.add_case(self.case_id, "res-maria", eligible=True,
                                        active=True, address="12 Oak St", caseworker="ana")
        self.office.case_store.set_entitlement(self.case_id, self.period, 412)

    # --- helpers ------------------------------------------------------------

    def receipt(self, inbox, request_id):
        bundle = inbox.gate.receipt_bundle({"request_id": request_id})
        return bundle, verify(bundle)

    def refunds_for(self, request_id):
        """Refunds that landed in the simulated payment rail for this request's effect id."""
        eid = effect_id_for({"request_id": request_id})
        return [r for r in self.office.payment_rail.backend.refunds if r["eid"] == eid]

    def assert_receipt_sound(self, inbox, request_id):
        """Every receipt verifies, and executed is never True without a confirmation."""
        bundle, result = self.receipt(inbox, request_id)
        self.assertTrue(result["valid"], f"{request_id} did not verify: {result['problems']}")
        summary = bundle["summary"]
        if summary["executed"] is True:
            # executed True must coincide with a committed, recorded effect.
            self.assertTrue(summary["recorded"])
            self.assertEqual(result["happened"], True)
        else:
            self.assertIn(summary["executed"], (False, "unknown"))
        return bundle, result

    # --- (a) routine $412 reissue commits -----------------------------------

    def test_a_routine_reissue_commits(self):
        request = {"id": "a", "action": "reissue_payment", "case_id": self.case_id,
                   "period": self.period, "amount": 412}
        status = self.office.submit(request)
        self.assertEqual(status, "COMMITTED")
        bundle, result = self.assert_receipt_sound(self.office.payments, "a")
        self.assertEqual(bundle["summary"]["executed"], True)
        self.assertEqual(bundle["summary"]["final"], "COMMITTED")
        # Exactly one payment landed in the simulated rail for this effect id.
        self.assertEqual(len(self.refunds_for("a")), 1)

    # --- (b) $4,120 on a $412 entitlement, refused before send --------------

    def test_b_over_entitlement_refused_naming_limit(self):
        request = {"id": "b", "action": "reissue_payment", "case_id": self.case_id,
                   "period": self.period, "amount": 4120}
        status = self.office.submit(request)
        self.assertEqual(status, "QUEUED")       # a failed rule goes to a person, not auto-run
        item = self.office.payments.queue["b"]
        self.assertIn("within entitlement", item["detail"])
        # The facts the rule read name the entitlement limit it hit.
        self.assertEqual(item["facts"]["entitlement"], 412)
        bundle, result = self.assert_receipt_sound(self.office.payments, "b")
        self.assertEqual(bundle["summary"]["executed"], False)
        # No money moved: no payment landed in the rail.
        self.assertEqual(len(self.refunds_for("b")), 0)

    # --- (c) second reissue after a caseworker reissued by hand -------------

    def test_c_duplicate_reissue_refused(self):
        self.office.ledger.record(self.case_id, "reissue", 412, period=self.period,
                                  source="caseworker:ben")
        request = {"id": "c", "action": "reissue_payment", "case_id": self.case_id,
                   "period": self.period, "amount": 412}
        status = self.office.submit(request)
        self.assertEqual(status, "QUEUED")
        item = self.office.payments.queue["c"]
        self.assertIn("at most one reissue per period", item["detail"])
        self.assertEqual(item["facts"]["prior_reissues"], 1)
        self.assert_receipt_sound(self.office.payments, "c")
        # The hand reissue stands; the assistant's reissue never reached the rail.
        self.assertEqual(self.office.ledger.reissues_for(self.case_id, self.period), 1)
        self.assertEqual(len(self.refunds_for("c")), 0)

    # --- (d) case closed mid-decision, refused at send time -----------------

    def test_d_closed_while_deciding_refused_with_change(self):
        request = {"id": "d", "action": "reissue_payment", "case_id": self.case_id,
                   "period": self.period, "amount": 412}
        inbox = self.office.payments
        facts = inbox.capture(request)                 # read while active
        proposal = inbox._proposal(request, {"by": "policy", "rules": []}, facts)
        self.office.case_store.set_status(self.case_id, active=False)   # closed mid-decision
        self.clock.tick()
        status = inbox.gate.submit(proposal)
        self.assertEqual(status, "REFUSED:stale_premise")
        bundle, result = self.assert_receipt_sound(inbox, "d")
        self.assertEqual(bundle["summary"]["executed"], False)
        self.assertIn("active status changed", result["refused"])
        # No payment landed in the rail.
        self.assertEqual(len(self.refunds_for("d")), 0)

    # --- (e) crash after send, then restart: exactly one payment ------------

    def test_e_crash_then_recovery_exactly_once(self):
        request = {"id": "e", "action": "reissue_payment", "case_id": self.case_id,
                   "period": self.period, "amount": 412}
        inbox = self.office.payments
        facts = inbox.capture(request)
        proposal = inbox._proposal(request, {"by": "policy", "rules": []}, facts)
        with self.assertRaises(SimulatedCrash):
            inbox.gate.submit(proposal, crash_after_effect=True)
        self.clock.tick()
        recovered = inbox.gate.recover(now=self.clock())
        eid = effect_id_for({"request_id": "e"})
        self.assertIn(eid, recovered)
        self.assertTrue(recovered[eid].startswith("COMMITTED")
                        or recovered[eid] == "REAPPLIED_AFTER_QUERY")
        bundle, result = self.assert_receipt_sound(inbox, "e")
        self.assertEqual(bundle["summary"]["executed"], True)
        self.assertTrue(result["happened_once"])
        # Exactly one refund landed in the simulated rail for this effect id.
        matching = [r for r in self.office.payment_rail.backend.refunds if r["eid"] == eid]
        self.assertEqual(len(matching), 1)

    # --- (f) appointment booking and address change both commit -------------

    def test_f_booking_and_address_change_commit(self):
        book = {"id": "f-book", "action": "book_appointment", "case_id": self.case_id,
                "office": "Riverside Main (simulated)", "slot": "2026-10-02 10:00"}
        addr = {"id": "f-addr", "action": "change_address", "case_id": self.case_id,
                "new_address": "99 Pine Ave"}
        self.assertEqual(self.office.submit(book), "COMMITTED")
        self.assertEqual(self.office.submit(addr), "COMMITTED")

        b_bundle, _ = self.assert_receipt_sound(self.office.scheduling, "f-book")
        a_bundle, _ = self.assert_receipt_sound(self.office.records, "f-addr")
        self.assertEqual(b_bundle["summary"]["executed"], True)
        self.assertEqual(a_bundle["summary"]["executed"], True)
        # The simulated systems of record show the effects landed.
        self.assertIsNotNone(
            self.office.scheduler_store.by_eid(effect_id_for({"request_id": "f-book"})))
        self.assertEqual(self.office.case_store.address(self.case_id), "99 Pine Ave")


class ReceiptInvariantTest(unittest.TestCase):
    """The two non-negotiable receipt properties, across every scenario at once."""

    def test_every_receipt_verifies_and_none_overclaims(self):
        with tempfile.TemporaryDirectory(prefix="civic-inv-") as directory:
            clock = Clock()
            office = CivicOffice(directory, clock=clock)
            office.case_store.add_resident("res-x", "X (simulated)")
            office.case_store.add_case("c1", "res-x", eligible=True, active=True,
                                       address="1 A St", caseworker="ana")
            office.case_store.set_entitlement("c1", "2026-09", 412)

            # One of each outcome: commit, over-entitlement, duplicate.
            office.submit({"id": "ok", "action": "reissue_payment", "case_id": "c1",
                           "period": "2026-09", "amount": 412})
            office.submit({"id": "too-big", "action": "reissue_payment", "case_id": "c1",
                           "period": "2026-09", "amount": 4120})
            office.ledger.record("c1", "reissue", 412, period="2026-10", source="hand")
            office.case_store.set_entitlement("c1", "2026-10", 412)
            office.submit({"id": "dupe", "action": "reissue_payment", "case_id": "c1",
                           "period": "2026-10", "amount": 412})

            for inbox, rid in ((office.payments, "ok"), (office.payments, "too-big"),
                               (office.payments, "dupe")):
                bundle = inbox.gate.receipt_bundle({"request_id": rid})
                result = verify(bundle)
                self.assertTrue(result["valid"], f"{rid}: {result['problems']}")
                if bundle["summary"]["executed"] is True:
                    self.assertEqual(result["happened"], True,
                                     f"{rid} claims executed True without a confirmation")


if __name__ == "__main__":
    unittest.main()
