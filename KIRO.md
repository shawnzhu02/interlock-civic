# How Kiro was used

## The short version

Everything new in this repo for the civic version was written by Kiro, through the **Kiro CLI (2.34.0) running headless**:

- the spec;
- the simulated case system, ledger and scheduler;
- the three civic targets;
- the `CivicOffice` facade and the pre-action rules;
- the demo generator, the demo page, and the civic tests.

I (Shawn, solo entrant) directed the work from Claude Code. That covered three things:

- I wrote the steering docs and the build brief (`docs/kiro-brief.md`).
- I sent Kiro each run's instructions with `kiro-cli chat --no-interactive`.
- I reviewed every result and ran the full test suite before each commit.

The commit history shows which commits Kiro produced and which commit is the starting snapshot.

**Starting point.** The engine underneath comes from the MIT-licensed Interlock prototype (`github.com/az-said/Interlock`): the gate, the journal, receipts and recovery. The first commit is that snapshot, with material from an earlier hackathon removed. Everything civic was built on top of it, in Kiro, today.

## Kiro tools used, and how they differed

- **Kiro CLI, V3 engine, spec mode** (`kiro-cli chat --v3 --mode spec --no-interactive`). I used it to write the spec, then to execute the spec's tasks in batches (tasks 1 to 4, then the demo and tests).
- **Kiro CLI, V3 engine, default mode** (no spec). I used it once, for the judge-facing demo page, under a hard time limit.
- **Headless runs.** These were the key enabler.
  - A headless run takes a single instruction, so each run had to be self-contained: it names the files to read first, the tasks to execute, the tests to run after each task, and where to stop. That turned out to be a good fit for spec mode, because `tasks.md` already numbers the work. "Execute tasks 1 to 4, run the suite after each, stop before 5" was the whole instruction.
  - Each run's transcript is committed in [`docs/kiro-logs/`](docs/kiro-logs/): `spec1-plan.log`, `spec1-tasks1-4.log`, `demo.log` and `pbt.log`. The claims in this file can be checked against what Kiro actually printed.
- **Not used:** Kiro IDE, Kiro Web and Crew.

**What I learned about the CLI:**
- With a normal Google login, headless mode worked without the paid `KIRO_API_KEY`.
- `--trust-workspace` was required so that the workspace's steering, hooks and MCP config would load without an interactive prompt.

## Spec-driven development

The spec is in `.kiro/specs/civic-case-actions/`. Its input was the "Spec 1" section of `docs/kiro-brief.md`. Kiro's spec mode wrote three files:

- **`requirements.md`:** 10 requirements in EARS format, with numbered acceptance criteria.
- **`design.md`:** a design that maps the civic actions onto the existing engine instead of inventing a new one:
  - `Gate` for dispatch, premise re-checks and recovery;
  - `approvals.Rule`, `Route` and `Inbox` for the "was it the right action?" check;
  - one target per system, modeled on `targets/payments.py`.
- **`tasks.md`:** 10 numbered tasks. Every sub-task cites the acceptance criteria it satisfies.

**What the spec caught that vibe coding would not have:**

- **It split the property-based tests by scope.** The brief listed five properties. Kiro placed three of them in this spec: at most one effect, rules hold under concurrency, and receipts never overclaim. It noted that the other two (ledger reconciliation, and the lifecycle moving only on evidence) belong to the outcome-tracking spec. That kept this spec's tests honest about what it actually builds.
- **It stated its own assumptions.** Kiro flagged the module layout as an inference, and made the "large amount" limit configurable because the brief said only "a set limit". Both were visible in review before any code existed.
- **It tied the tasks to the existing engine.** Task 5 says "through the gate (not a bespoke check)". Kiro then did not write a second state machine. A case closed while the assistant was deciding is refused by the gate's existing premise re-check at send time.

**Compared with vibe coding:** the demo page was built in default mode, with a long one-shot instruction. It was faster to start. But the instruction had to carry everything a spec would have held (the scenarios, the outcomes, the accessibility rules), and nothing in it is traceable to a requirement. For the engine-facing code, where a wrong refusal or a double payment is the whole failure, the spec was worth the extra step.

**Spec progress, as of the deadline:**

- Tasks 1–4 (the simulated systems, the targets, the facade, the rules), 9.1 (unit tests) and 10 (property tests, including a bug fix; see below) are done.
- Tasks 5–8 are not ticked. Scenarios d (closed while deciding) and e (crash and restart) already pass through the existing gate's send-time re-check and recovery, which task 5 asks to verify. But the dedicated tests for that task, the lease and routing tests (9.2), and the MCP server (task 8) are not built yet.

## Steering docs

`.kiro/steering/` holds four docs:

- **`product.md`**, **`tech.md`** and **`structure.md`**: always included.
- **`receipts.md`**: a `fileMatch` doc, loaded only when engine, backend, demo or test files are in play.

I checked what was loaded with a one-off headless probe; that output was not logged. Kiro reported `product.md`, `structure.md` and `tech.md`, as expected for a run with no matching files open. The logged runs show Kiro reading the steering docs before it planned (`spec1-plan.log`).

**The rules that made the biggest difference:**

- **"A receipt never claims more than the evidence."** Together with the lifecycle rules in `receipts.md`, it shaped the demo's resident-facing text and the tests. Those tests assert that no receipt says `executed=True` without confirmation.
- **"Standard library only at runtime."** Kiro kept `dependencies = []` across every run.
- **"New code reuses the engine."** Kiro said it took the module layout (`backend/civic/`, `interlock/targets/civic/`) from the brief and from `structure.md`. The rules it built extend `approvals.Rule` and `Inbox`, as `structure.md` asks.

**Strategy:** steering holds what is true in every run (the product rules, the tech constraints, the module map). The brief holds what one spec needs. Each headless instruction holds only "which tasks, and where to stop". That kept every instruction short.

## Agent hooks

`.kiro/hooks/` defines three hooks in the CLI's JSON hook format (`version: v1`):

- **`engine-tests-on-save.json`** (`PostFileSave` on `interlock/**.py`): runs the core contract, gate and receipt tests.
- **`regenerate-results.json`** (`PostFileSave` on `experiments/**.py`): regenerates `results/` and the viewer data, so the published tables never drift. CI fails on drift.
- **`cite-every-number.json`** (`PostFileSave` on the README, this file, and the demo pages): an agent hook that lists every number and checks it has a source. It also flags "done" wording that runs ahead of a receipt.

**What the hooks did:**

- **They fire in headless V3 runs, including on files the agent writes.** In the earlier runs, nothing matched: no experiment file and no demo page was written, so nothing fired. During the demo build, both hooks fired.
- **`regenerate-results`**: the evidence is indirect. Kiro was told to touch no other files and never ran `run_all.py` or `viewer/build.py` itself (see `demo.log`). Yet after it wrote `experiments/civic_story.py`, `results/` and the viewer data had been regenerated with new `Generated` timestamps. They are in commit `b01847c`. The only thing configured to do that is this hook. It is a command hook, so its output does not appear in the agent transcript.
- **`cite-every-number`** fired when Kiro wrote `demo/civic.html`, and Kiro stopped to run the audit. It found that the page hard-codes no civic numbers: every amount ($412, $4,120) comes from `demo/civic_data.js`, which the real engine generates. It also checked the wording rule. "Done" appears only when `resident_status()` sees `executed is True`, and the page prints a caution line whenever `executed` is not true. As the hook instructs, Kiro reported and made no edits. This is the hook working as a reviewer inside the agent's own loop.
- **`engine-tests-on-save`** did not fire, because no file under `interlock/` was edited after the hooks were in place. The headless instructions also told Kiro to run the full suite after each task. It did, and reported 362 passing tests after each of tasks 1 to 4.

## MCP

`.kiro/settings/mcp.json` configures these servers:

- **Stripe:** remote, at `https://mcp.stripe.com`.
- **GitHub.**
- **Fetch.**
- **`civic-office-gated`:** the project's own `interlock-mcp` proxy in front of a civic office MCP server.

**Honest result:**
- In headless runs, Stripe's remote server failed with `Dynamic client registration not supported`. Its OAuth needs an interactive login, so Stripe MCP was not used to build this.
- `civic-office-gated` stays disabled until spec task 8 (the office's MCP server) is built. The design is in place: `interlock/mcp_proxy.py` already gates any MCP server's tool calls. Once it is enabled, Kiro's own calls on the office would go through Interlock and leave receipts.

## Property-based testing

Kiro wrote `tests/test_civic_properties.py` from spec task 10. The tests drive the real `CivicOffice` with Hypothesis. Hypothesis is a dev-only dependency that skips cleanly when it is missing. The log is `docs/kiro-logs/pbt.log`.

| property (requirement) | examples | result |
|---|---|---|
| At most one effect (10.2) | 60, varying crash point, 0–3 duplicate deliveries, 0–3 extra recoveries, clock jumps | passed |
| Rules hold under concurrency (10.3) | 60 interleavings of assistant and caseworker reissues on one case and period | **found a real bug** |
| Receipts never overclaim (10.4) | 60 refused and stale-premise histories | passed |

**The bug PBT found.**
- Hypothesis shrank it to `steps=['assistant','assistant'], entitlement=412`: two assistant reissues for the same month both paid, for a total of $824 on a $412 entitlement.
- The "one reissue per period" rule counted prior reissues from the ledger only. The assistant's own reissues land on the payment rail, and in this spec nothing writes them to the ledger.
- The unit tests missed it because every duplicate scenario in them is "a caseworker paid by hand, then the assistant tries". That case is recorded in the ledger, so the rule catches it. Two assistant requests in a row was a case nobody had written down.

The failing property was committed first, as `expectedFailure` with the counterexample, so the find is visible in the history. Kiro was then asked to fix it (`docs/kiro-logs/pbt-fix.log`).

**The fix.** The rule now counts the period's prior reissues from both the ledger and the payment rail, and does not count the same reissue twice. The count is also a premise, so the gate re-checks it at send time. With the fix, the property passes, the full suite passes (372 tests), and the six demo outcomes are unchanged.

**What removing `expectedFailure` exposed.**
- A second counterexample came out: `['assistant','hand']`. The assistant reissues, then a caseworker reissues by hand, and the total paid is $824.
- An `expectedFailure` test passes if any assertion fails, so this second failure had been hidden behind the first.
- A hand reissue is written straight to the ledger and never goes through the gate, so no gate can stop it.
- Kiro narrowed the property to the guarantee Interlock can actually make: the gated path never pays twice for a period, and it is blocked once any reissue is on record. Kiro stated that narrowing in its summary.
- This is a real product finding: the caseworker's own tools need to go through the same check, or the caseworker needs a warning when a gated payment already exists. It goes in the next spec.

**A second, smaller catch.** An early draft of property 10.4 included a crash-before-send history followed by recovery. Hypothesis falsified it: `executed` was `True`. That turned out to be correct behavior, because recovery legitimately sends a tier-1 effect again and the payment really lands. So Kiro narrowed the property and documented why. PBT forced the spec's notion of an "unconfirmed history" to be stated precisely.

**Compared with the base engine's 2,000-case fault sweep:** that sweep varies faults in the engine's own refund model, against a single caller. The civic properties vary the civic office's callers, which is where this bug lived. The two are complementary.

## Kiro powers

None used in this build.
