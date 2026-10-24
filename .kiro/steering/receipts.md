---
inclusion: fileMatch
fileMatchPattern: ["interlock/**/*.py", "backend/**/*.py", "demo/**/*.html", "tests/**/*.py"]
---

# Receipts and the outcome lifecycle

These rules hold for every change to the engine, the backend, or a page that shows a receipt.

## The four facts

Every effect's receipt reports `proposed`, `authorized`, `executed`, `recorded`, and a final state.

- `executed` is what a system of record confirmed. It is not what was attempted. After a crash that nobody can resolve, `executed` is `unknown`.
- `recorded` is true only when the agency ledger holds an entry that matches the confirmed effect: same case, same amount, same effect id.
- `verify()` must reject any receipt whose entries do not chain, are out of order, or claim a state the entries do not support.

## The civic outcome lifecycle

```
requested -> sent -> confirmed -> recorded
     |         |         |
     +---------+---------+-----> failed (with the reason and the source that reported it)
```

- A state moves forward only on evidence from the system that owns it. `sent` comes from our own DISPATCHED entry. `confirmed` comes from the payment rail (a webhook or a lookup). `recorded` comes from the ledger.
- `failed` can arrive after `confirmed`. For example, a payment to a closed account is returned days later. A late failure reopens the case, puts it in the caseworker queue, and changes what the resident's status page says.
- A page that the assistant or the resident sees never shows a state ahead of the evidence.

## Wording

- Resident-facing text is plain language, written at about a grade-6 reading level. It says what happened, what happens next, and when. For example: "Your payment was sent on Oct 3. The bank has not confirmed it yet. We will check again tomorrow."
- Caseworker-facing text states what changed, from what value to what value, and the suggested fix, using `escalation.describe()`.
- Never write "done", "complete", or "on its way" unless the receipt says `confirmed` or later.
