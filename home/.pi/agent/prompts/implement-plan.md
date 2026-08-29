---
description: Implement a Markdown plan phase-by-phase, pausing for review after each step
argument-hint: "<path-to-plan.md> [starting phase/step]"
---

Implement the plan described in this file: $ARGUMENTS

If no file path is given, look for a plan file in the current context (recently referenced `.md` file, or ask which one).

## Workflow

1. Read the plan file fully and identify its phases/steps in order.
2. If a starting phase/step was given in the arguments, start there. Otherwise start from the first unimplemented one — check the codebase state, not just the plan file, to figure out what's already done.
3. Implement **exactly one phase/step** — no more, even if the next one looks trivial or related.
4. Stop. Do not run `git add` or `git commit` unless explicitly asked in this turn.
5. Report:
   - which phase/step you implemented
   - files changed
   - anything you deviated from in the plan and why
   - anything that needs manual verification (e.g. env vars, migrations, external service setup)
6. Wait for the user. They will either:
   - ask for changes to this step,
   - give a commit instruction (see below), or
   - ask you to continue to the next step.
     Do not proceed to the next phase/step on your own.

## Commit instructions

Only commit when explicitly asked, and only what's explicitly asked (e.g. "commit staged files", "commit all except the plan file", "commit everything"). If ambiguous, ask which files before committing.

Commit message rules:

- Describe what changed and why, in enough detail to understand the change without reading the diff.
- No step/phase numbers or references to the plan's internal numbering (e.g. not "Step 3: ..." or "Phase 2 - ...") — the message should read like a normal standalone commit, since the plan is a working doc, not part of project history.
- Prefer multiple focused commits over one large commit when the changes are logically separable (e.g. don't bundle unrelated files just because they were touched in the same step).
- Use imperative mood ("Add", "Fix", "Refactor" — not "Added"/"Fixes").

## Constraints

- Never skip ahead to a later phase/step, even if asked to "implement the plan" generally — always confirm which step first if unclear.
- Never mark the plan file itself as done/checked-off unless the plan uses checkboxes and the user asks you to update it.
- If a step in the plan is no longer valid because of earlier deviations, flag it before implementing — don't silently adapt without saying so.
