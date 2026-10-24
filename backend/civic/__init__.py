"""
Simulated systems of record for the fictional Riverside County Benefits Office.

Everything in this package is SIMULATED (SQLite, standard library only). The
payment *rail* is real Stripe test mode and lives in
``interlock/targets/civic/payment_rail.py``; the case system, ledger, and
scheduler here are stand-ins labeled "simulated" everywhere they appear.

See ``.kiro/steering/structure.md`` and the civic-case-actions spec.
"""
from .case_store import CaseStore
from .ledger import Ledger
from .scheduler_store import SchedulerStore

__all__ = ["CaseStore", "Ledger", "SchedulerStore"]
