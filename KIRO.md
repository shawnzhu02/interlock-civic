# How Kiro was used

> Fill in each section from what actually happened while building. Delete this note and every _TODO_ before submitting. Keep it honest. The judges read the `.kiro/` folder and the git history.

## Starting point

This entry builds on the MIT-licensed Interlock transaction-control prototype (`github.com/az-said/Interlock`): the gate, the journal, receipts, and recovery. Kiro was used to build everything new for the civic version. That covers the civic actions, outcome tracking, the caseworker console, the resident status page, the property-based tests, and the benefits experiment. The commit history shows which is which.

## Kiro tools used

_TODO: Which of Kiro IDE, CLI, Web, and Crew did you use? What did each one do well or badly? Where did you switch between them, and why?_

## Spec-driven development

The three specs are in `.kiro/specs/`. Their input was `docs/kiro-brief.md`.

_TODO: For each spec, say how the requirements, design, and tasks were structured. Say what you changed after Kiro's first draft and why. Give a concrete moment when the spec caught something vibe coding would have missed. Compare it with a part you vibe coded, if there is one._

## Agent hooks

`.kiro/hooks/` holds three hooks:

- `engine-tests-on-save.json`: runs the core contract, gate, and receipt tests whenever an engine file is saved.
- `regenerate-results.json`: regenerates `results/` and the viewer data whenever an experiment changes, so the published tables never drift from the code.
- `cite-every-number.json`: when the README, this file, or a demo page is saved, an agent checks that every number has a source and that no wording claims "done" ahead of the evidence.

_TODO: What did each hook catch? Give one concrete example per hook. Did you add, change, or remove hooks along the way?_

## Steering docs

`.kiro/steering/` holds four docs:

- `product.md`, `tech.md`, `structure.md`: always included.
- `receipts.md`: included only when engine, backend, demo, or test files are open.

_TODO: Which steering rule changed Kiro's output the most? Give a before and after. Example: the rule "never write 'done' unless the receipt says confirmed"._

## MCP

`.kiro/settings/mcp.json` configures these servers:

- Stripe (remote, OAuth, test mode).
- GitHub.
- Fetch.
- `civic-office-gated`: the project's own `interlock-mcp` proxy in front of the civic office's MCP server, so Kiro's own tool calls on the office go through Interlock and leave receipts.

_TODO: What did each server make possible? For example, checking Stripe test objects while building outcome tracking, or reading the GAO report and PaymentAccuracy.gov data. Did you enable `civic-office-gated`, and what did its receipts show?_

## Property-based testing

_TODO: Which requirements had PBT turned on? See the list in `docs/kiro-brief.md`. Which bugs did PBT find that the unit tests and the existing 2,000-case randomized fault sweep did not? Give the shrunk counterexample for each._

## Kiro powers

_TODO: Which powers did you install? What did each one add?_
