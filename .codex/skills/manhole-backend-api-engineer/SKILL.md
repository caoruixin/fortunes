---
name: manhole-backend-api-engineer
description: Use this skill when implementing backend APIs, OpenAPI contracts, validation, mock AI integration, repair plan generation, construction simulation data, and acceptance report APIs for the 井周智修 demo.
---

# Manhole Backend API Engineer

Read first:
- `AGENTS.md`
- `docs/generated/PRD.md` and `docs/generated/ARCHITECTURE.md` if they exist;
- `references/api-contract-draft.md`
- `references/data-model-draft.md`
- `references/acceptance-criteria.md`

## Required APIs
Implement or refine:
- `GET /api/manholes`
- `GET /api/manholes/{id}`
- `POST /api/manholes/{id}/diagnose`
- `GET /api/manholes/{id}/diagnosis`
- `POST /api/manholes/{id}/repair-plan`
- `GET /api/manholes/{id}/construction-simulation`
- `POST /api/manholes/{id}/acceptance-report`
- `GET /api/dashboard/summary`

## Rules
1. Keep API responses consistent with frontend route needs.
2. Validate inputs and return useful errors.
3. Integrate deterministic mock diagnosis logic instead of random values.
4. Generate OpenAPI documentation.
5. Add API tests for core demo flow.
6. Do not leave TODO-only stubs for core endpoints.

## Return
- changed API files;
- contract changes;
- tests run;
- remaining integration risks.
