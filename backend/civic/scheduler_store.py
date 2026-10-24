"""
The SIMULATED appointment scheduler for the Riverside County Benefits Office.

A stand-in for a real scheduler, backed by SQLite (standard library only). A
booking is written with a reference tied to the effect id and can be looked up
by that reference, which is how the tier-2 scheduler target confirms after a
crash (Req 2.4). Time is injected via ``clock=``.

Every display name and log line carries a "SIMULATED" label (Req 2.5).
"""
import contextlib
import sqlite3
import sys
import time

LABEL = "SIMULATED scheduler (Riverside County Benefits Office)"


def _log(message):
    print(f"[{LABEL}] {message}", file=sys.stderr)


def ref_for(eid):
    """The booking reference tied to an effect id."""
    return f"BK-{eid}"


class SchedulerStore:
    def __init__(self, path, clock=time.time):
        self.path = path
        self.clock = clock
        with self._db() as db:
            db.execute(
                "CREATE TABLE IF NOT EXISTS bookings ("
                "rowid INTEGER PRIMARY KEY AUTOINCREMENT, "
                "case_id TEXT NOT NULL, office TEXT NOT NULL, slot TEXT NOT NULL, "
                "ref TEXT NOT NULL UNIQUE, eid TEXT NOT NULL, at REAL NOT NULL)")

    @contextlib.contextmanager
    def _db(self):
        with contextlib.closing(sqlite3.connect(self.path, timeout=30)) as db, db:
            yield db

    def book(self, case_id, office, slot, eid):
        """Write a booking referenced by the effect id. Idempotent on the reference."""
        ref = ref_for(eid)
        at = self.clock()
        with self._db() as db:
            db.execute(
                "INSERT OR IGNORE INTO bookings (case_id, office, slot, ref, eid, at) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (case_id, office, slot, ref, eid, at))
        _log(f"booked case {case_id} at {office} for {slot} (ref={ref})")
        return ref

    def by_ref(self, ref):
        with self._db() as db:
            row = db.execute(
                "SELECT rowid, case_id, office, slot, ref, eid, at "
                "FROM bookings WHERE ref = ?", (ref,)).fetchone()
        if row is None:
            return None
        keys = ("rowid", "case_id", "office", "slot", "ref", "eid", "at")
        return dict(zip(keys, row))

    def by_eid(self, eid):
        """The booking tagged with this effect id, or None."""
        return self.by_ref(ref_for(eid))
