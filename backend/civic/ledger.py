"""
The SIMULATED agency ledger for the Riverside County Benefits Office.

An append-only record of the payments and refunds the office has recorded,
backed by SQLite (standard library only). Entries can come from any source:
Interlock sends, and a caseworker acting by hand from the dashboard. The
one-reissue-per-period rule counts from here, so a reissue made by hand is seen
too (Req 4.2).

``reissues_for`` and ``recorded_total`` count entries for a (case_id, period)
from any source. Time is injected via ``clock=``.

Every display name and log line carries a "SIMULATED" label (Req 2.5).
"""
import contextlib
import sqlite3
import sys
import time

LABEL = "SIMULATED ledger (Riverside County Benefits Office)"


def _log(message):
    print(f"[{LABEL}] {message}", file=sys.stderr)


class Ledger:
    def __init__(self, path, clock=time.time):
        self.path = path
        self.clock = clock
        with self._db() as db:
            db.execute(
                "CREATE TABLE IF NOT EXISTS ledger ("
                "rowid INTEGER PRIMARY KEY AUTOINCREMENT, "
                "case_id TEXT NOT NULL, period TEXT, kind TEXT NOT NULL, "
                "amount REAL NOT NULL, eid TEXT, source TEXT NOT NULL, at REAL NOT NULL)")

    @contextlib.contextmanager
    def _db(self):
        with contextlib.closing(sqlite3.connect(self.path, timeout=30)) as db, db:
            yield db

    def record(self, case_id, kind, amount, period=None, eid=None, source="office"):
        """Append one entry. Append-only: there is no update or delete."""
        at = self.clock()
        with self._db() as db:
            db.execute(
                "INSERT INTO ledger (case_id, period, kind, amount, eid, source, at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (case_id, period, kind, amount, eid, source, at))
        _log(f"recorded {kind} {amount} for case {case_id} period {period} "
             f"(source={source}, eid={eid})")

    def entries(self, case_id=None, period=None):
        clauses, args = [], []
        if case_id is not None:
            clauses.append("case_id = ?")
            args.append(case_id)
        if period is not None:
            clauses.append("period = ?")
            args.append(period)
        where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
        with self._db() as db:
            rows = db.execute(
                "SELECT rowid, case_id, period, kind, amount, eid, source, at "
                "FROM ledger" + where + " ORDER BY rowid", args).fetchall()
        keys = ("rowid", "case_id", "period", "kind", "amount", "eid", "source", "at")
        return [dict(zip(keys, row)) for row in rows]

    def reissues_for(self, case_id, period):
        """How many reissues this case and period already has, from any source."""
        return sum(1 for e in self.entries(case_id, period) if e["kind"] == "reissue")

    def recorded_total(self, case_id, period):
        """Total of reissues and refunds recorded for this case and period, any source."""
        return sum(e["amount"] for e in self.entries(case_id, period)
                   if e["kind"] in ("reissue", "refund"))
