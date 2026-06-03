# Delivery Roadmap

## Phase 1: Design Freeze

Goal: turn `references/solution.md` and `references/demo-requirements.md` into buildable specs.

Deliverables:
- `docs/generated/PRD.md`
- `docs/generated/ARCHITECTURE.md`
- `docs/generated/UI_SPEC.md`
- updated `references/acceptance-criteria.md`

Agents and skills:
- `domain-product-owner` + `manhole-demo-prd`
- `api-designer` + `manhole-solution-architecture`
- `ui-designer` + `manhole-ui-ux-demo-designer`

## Phase 2: Foundation

Goal: build the technical foundation without chasing visual polish yet.

Deliverables:
- frontend app scaffold;
- backend app scaffold;
- database schema, migration and seed;
- OpenAPI draft;
- mock fixture data.

Agents and skills:
- `postgres-pro` + `manhole-database-designer`
- `backend-developer` or `fastapi-developer` + `manhole-backend-api-engineer`
- `frontend-developer` or `nextjs-developer` + `manhole-frontend-demo-engineer`

## Phase 3: Core Demo Loop

Goal: implement the customer-visible closed loop.

Deliverables:
- deterministic mock diagnosis engine;
- map -> detail -> diagnosis -> plan -> simulation -> acceptance report;
- heatmap, polygon, grouting point and timeline data;
- demo script route.

Agents and skills:
- `ai-diagnosis-mock-engineer` + `manhole-diagnosis-mock`
- `backend-developer` + `manhole-backend-api-engineer`
- `frontend-developer` + `manhole-frontend-demo-engineer`
- `ui-designer` + `manhole-ui-ux-demo-designer`

## Phase 4: Delivery Validation

Goal: make the Demo runnable by a non-developer and defensible in review.

Deliverables:
- Docker Compose;
- `.env.example`;
- seed script;
- API tests;
- E2E tests;
- README startup and reset instructions;
- P0/P1 issue fixes.

Agents and skills:
- `qa-expert` + `manhole-qa-validation` + `playwright`
- `docker-expert` + `manhole-devops-local-runner`
- `reviewer` + `security-auditor` + `manhole-code-review`
