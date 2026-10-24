"""
The SIMULATED case system for the Riverside County Benefits Office.

A stand-in for a real agency case system, backed by SQLite (standard library
only). It holds residents, cases, per-period entitlements, eligibility/active
flags, the mailing address, the assigned caseworker, and a fraud flag.

Read helpers return systems-of-record data only; nothing here trusts an
assistant's account of what happened (see ``.kiro/steering/product.md``). Time
is injected via ``clock=`` so tests are deterministic.

Every display name and log line carries a "SIMULATED" label (Req 2.5).
"""
import contextlib
import sqlite3
import sys
import time

LABEL = "SIMULATED case system (Riverside County Benefits Office)"


def _log(message):
    print(f"[{LABEL}] {message}", file=sys.stderr)


class CaseStore:
    def __init__(self, path, clock=time.time):
        self.path = path
        self.clock = clock
        with self._db() as db:
            db.execute(
                "CREATE TABLE IF NOT EXISTS residents ("
                "id TEXT PRIMARY KEY, name TEXT NOT NULL)")
            db.execute(
                "CREATE TABLE IF NOT EXISTS cases ("
                "id TEXT PRIMARY KEY, resident_id TEXT NOT NULL, "
                "eligible INTEGER NOT NULL, active INTEGER NOT NULL, "
                "address TEXT, caseworker TEXT, fraud INTEGER NOT NULL DEFAULT 0)")
            db.execute(
                "CREATE TABLE IF NOT EXISTS entitlements ("
                "case_id TEXT NOT NULL, period TEXT NOT NULL, amount REAL NOT NULL, "
                "PRIMARY KEY (case_id, period))")
            db.execute(
                "CREATE TABLE IF NOT EXISTS address_changes ("
                "rowid INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL, "
                "new_address TEXT, eid TEXT, source TEXT NOT NULL, at REAL NOT NULL)")

    @contextlib.contextmanager
    def _db(self):
        with contextlib.closing(sqlite3.connect(self.path, timeout=30)) as db, db:
            yield db

    # --- writes (fixtures / the office acting, never the assistant) ---------

    def add_resident(self, resident_id, name):
        with self._db() as db:
            db.execute("INSERT OR REPLACE INTO residents VALUES (?, ?)", (resident_id, name))
        _log(f"resident {resident_id} recorded")

    def add_case(self, case_id, resident_id, eligible=True, active=True,
                 address=None, caseworker=None, fraud=False):
        with self._db() as db:
            db.execute(
                "INSERT OR REPLACE INTO cases VALUES (?, ?, ?, ?, ?, ?, ?)",
                (case_id, resident_id, int(eligible), int(active), address,
                 caseworker, int(fraud)))
        _log(f"case {case_id} recorded")

    def set_entitlement(self, case_id, period, amount):
        with self._db() as db:
            db.execute("INSERT OR REPLACE INTO entitlements VALUES (?, ?, ?)",
                       (case_id, period, amount))
        _log(f"entitlement for case {case_id} period {period} set to {amount}")

    def set_status(self, case_id, eligible=None, active=None):
        row = self._case(case_id)
        eligible = row["eligible"] if eligible is None else int(eligible)
        active = row["active"] if active is None else int(active)
        with self._db() as db:
            db.execute("UPDATE cases SET eligible = ?, active = ? WHERE id = ?",
                       (eligible, active, case_id))
        _log(f"case {case_id} status now eligible={bool(eligible)} active={bool(active)}")

    def set_address(self, case_id, address, eid=None, source="office"):
        """
        Change the mailing address and log the change. ``eid`` tags a change made
        through the gate, so the case-records target can confirm by lookup whether
        the eid-tagged change landed, and detect a change made elsewhere since a
        decision. Idempotent per eid: a change already recorded for this eid is not
        applied again.
        """
        at = self.clock()
        with self._db() as db:
            if eid is not None and db.execute(
                    "SELECT 1 FROM address_changes WHERE eid = ?", (eid,)).fetchone():
                return                          # this eid-tagged change already landed
            db.execute("UPDATE cases SET address = ? WHERE id = ?", (address, case_id))
            db.execute(
                "INSERT INTO address_changes (case_id, new_address, eid, source, at) "
                "VALUES (?, ?, ?, ?, ?)", (case_id, address, eid, source, at))
        _log(f"case {case_id} mailing address changed (source={source}, eid={eid})")

    def address_change_by_eid(self, eid):
        """The address change tagged with this effect id, or None (lookup for recovery)."""
        with self._db() as db:
            row = db.execute(
                "SELECT rowid, case_id, new_address, eid, source, at "
                "FROM address_changes WHERE eid = ? ORDER BY rowid DESC LIMIT 1",
                (eid,)).fetchone()
        if row is None:
            return None
        keys = ("rowid", "case_id", "new_address", "eid", "source", "at")
        return dict(zip(keys, row))

    def address_changes_since(self, case_id, eid):
        """How many address changes this case has from a source other than this eid."""
        with self._db() as db:
            rows = db.execute(
                "SELECT eid FROM address_changes WHERE case_id = ?", (case_id,)).fetchall()
        return sum(1 for (other,) in rows if other != eid)

    def set_caseworker(self, case_id, caseworker):
        with self._db() as db:
            db.execute("UPDATE cases SET caseworker = ? WHERE id = ?", (caseworker, case_id))
        _log(f"case {case_id} caseworker now {caseworker}")

    def set_fraud(self, case_id, fraud):
        with self._db() as db:
            db.execute("UPDATE cases SET fraud = ? WHERE id = ?", (int(fraud), case_id))
        _log(f"case {case_id} fraud flag now {bool(fraud)}")

    # --- reads (systems of record only) -------------------------------------

    def _case(self, case_id):
        with self._db() as db:
            row = db.execute(
                "SELECT id, resident_id, eligible, active, address, caseworker, fraud "
                "FROM cases WHERE id = ?", (case_id,)).fetchone()
        if row is None:
            raise KeyError(f"no case {case_id} in {LABEL}")
        keys = ("id", "resident_id", "eligible", "active", "address", "caseworker", "fraud")
        return dict(zip(keys, row))

    def entitlement(self, case_id, period):
        """The entitlement amount for this case and period, or None if none is set."""
        with self._db() as db:
            row = db.execute(
                "SELECT amount FROM entitlements WHERE case_id = ? AND period = ?",
                (case_id, period)).fetchone()
        return None if row is None else row[0]

    def status(self, case_id):
        """{"eligible": bool, "active": bool} for this case."""
        row = self._case(case_id)
        return {"eligible": bool(row["eligible"]), "active": bool(row["active"])}

    def address(self, case_id):
        return self._case(case_id)["address"]

    def caseworker(self, case_id):
        return self._case(case_id)["caseworker"]

    def fraud_flagged(self, case_id):
        return bool(self._case(case_id)["fraud"])
