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
  - Each run's transcript was saved to a local log, so every claim in this file was checked against what Kiro actually printed.
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

## Steering docs

`.kiro/steering/` holds four docs:

- **`product.md`**, **`tech.md`** and **`structure.md`**: always included.
- **`receipts.md`**: a `fileMatch` doc, loaded only when engine, backend, demo or test files are in play.

I checked what was loaded with a headless probe: Kiro reported `product.md`, `structure.md` and `tech.md`, as expected for a run with no matching files open.

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
- **`regenerate-results`** fired when Kiro wrote `experiments/civic_story.py`. It regenerated `results/` and the viewer data. That commit contains the regenerated files, with new `Generated` timestamps.
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

Spec tasks 10.1 to 10.4 define three Hypothesis properties: at most one effect, rules hold under concurrency, and receipts never overclaim. **They were not run before the deadline.** The base engine already has a hand-written randomized fault sweep with 2,000 cases, which is still part of the suite. Comparing PBT findings against that sweep is the next step.

## Kiro powers

None used in this build.
