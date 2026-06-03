---
name: manhole-code-review
description: Use this skill when reviewing implementation quality, security, API/data consistency, demo completeness, tests, performance, maintainability, and compliance with the 井周智修 business workflow.
---

# Manhole Code Review

Read first:
- `AGENTS.md`
- `references/acceptance-criteria.md`
- changed files or diff under review.

## Review Priorities
1. Does the implementation complete the map -> diagnosis -> plan -> simulation -> report flow?
2. Are frontend fields, API contracts, and database schema consistent?
3. Is the mock AI deterministic and explainable?
4. Is Docker startup realistic?
5. Are tests covering demo-critical paths?
6. Are private assets or credentials accidentally committed?
7. Are security, validation, and error paths acceptable for a demo handed to customers?

## Output Format
Lead with findings ordered by severity:
- P0: blocks startup or core demo flow;
- P1: likely customer-visible failure or data inconsistency;
- P2: maintainability, polish, or follow-up issue.

Then include:
- open questions;
- test gaps;
- concise change summary if needed.

Do not spend review effort on unrelated refactors unless they affect delivery risk.
