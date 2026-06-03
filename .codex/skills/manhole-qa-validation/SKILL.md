---
name: manhole-qa-validation
description: Use this skill when designing, implementing, or running API tests, E2E tests, mock data integrity tests, Docker startup tests, and acceptance validation for the 井周智修 demo.
---

# Manhole QA Validation

Read first:
- `AGENTS.md`
- `references/acceptance-criteria.md`
- `docs/generated/PRD.md` and `docs/generated/ARCHITECTURE.md` if they exist.

## Required Validation
Cover the core flow:

```text
map
  -> select red high-risk manhole
  -> detail
  -> AI diagnosis
  -> C-level disease result
  -> repair plan
  -> construction simulation
  -> acceptance report
  -> before/after metric comparison
```

## Test Types
- API tests for core endpoints;
- deterministic mock AI tests for A/B/C/D;
- E2E tests with Playwright;
- seed data integrity tests;
- Docker startup smoke test.

## Rules
1. Prioritize failures that break the customer demo path.
2. Keep tests repeatable with deterministic fixtures.
3. Report P0/P1/P2 issues and propose minimal fixes.
4. Run available tests before final response.

## Return
- tests added or run;
- failures and fixes;
- unverified risks;
- final demo readiness status.
