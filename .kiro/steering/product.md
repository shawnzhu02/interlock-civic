---
inclusion: always
---

# Product: Interlock Civic

Interlock independently checks that AI assistants handling residents' public-benefit cases actually carry out the actions they say they carried out. Hackachusetts track: **Civic Services**.

## The problem in one story

A resident messages a benefits office's AI assistant: "My payment never came." Thirty seconds later the assistant replies, "Reissued, your $412 payment is on its way," and closes the case. A week later the payment fails because the resident's bank account was closed. The office's ledger never records the failure. Nobody notices until the resident misses rent and calls the office.

Public agencies are starting to let AI assistants act on cases: reissuing payments, refunding fees, booking appointments, and changing addresses. Today the only record of what the assistant did lives inside the assistant's own logs. One silent failure can repeat across thousands of cases.

## What Interlock checks

1. **Was it the right action?** Before an action runs, fixed rules compare it with the resident's request, the case's entitlement, payments already made for the same period, eligibility status, and the caseworker's authority. A $4,120 payment on a $412 entitlement, or a second reissue for the same missed payment, is stopped. Cases the rules cannot settle go to a person.
2. **Did it happen?** After the action, Interlock confirms the result in every system the action touches and tracks it over time. A payment moves from `requested` to `sent` to `confirmed` to `recorded`, or to `failed`. A failure that arrives days later (a closed account) reopens the case.
3. **If not:** the case goes to a caseworker with the evidence and a suggested fix. A retry happens only when it is safe. The assistant's "done" message to the resident is held until the checks pass.

## Users

- **Residents.** They get a plain-language status page that says where their action stands now. It never says "done" before the evidence does.
- **Caseworkers.** They get a queue of only the cases that need a person, each with the evidence, what changed, and a suggested fix.
- **Agency finance and auditors.** They get receipts they can verify without reconciling logs.

## The office in the demo is fictional

The demo office is the "Riverside County Benefits Office". Never use a real agency's name, seal, branding, or domain. Label the case system and the ledger as simulated everywhere they appear. The payment rail is real: Stripe test mode.

## Non-negotiable product rules

- **A receipt never claims more than the evidence shows.** If no system confirmed the action, `executed` is `unknown`, never `true`.
- **Never move money on a guess.** When it is unclear whether an action landed, say `AMBIGUOUS` and send it to a person.
- **Interlock is independent of the assistant.** It reads the systems of record itself. It never trusts the assistant's own account of what happened.
- **Every number shown to a judge or a resident has a source.** That means a file in `results/`, or a cited public source such as PaymentAccuracy.gov or GAO.
- **Accessibility is part of done.** Resident pages meet WCAG 2.2 AA, are written at about a grade-6 reading level, and work on a phone.
