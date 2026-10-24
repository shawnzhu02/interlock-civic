"""
Civic effect targets: one target per system of record, modeled on
``interlock/targets/payments.py``.

The engine stays domain-neutral; the civic wording lives here next to the
premises each target reads (see ``.kiro/steering/structure.md``).

    payment_rail.py   tier 1  reissue_payment + refund_fee (wraps Payments / stripe_api)
    scheduler.py      tier 2  book_appointment (simulated SQLite)
    case_records.py   tier 2  change_address (simulated SQLite)
"""
from .case_records import CaseRecords
from .payment_rail import PaymentRail
from .scheduler import Scheduler

__all__ = ["PaymentRail", "Scheduler", "CaseRecords"]
