---
name: manhole-demo-prd
description: Use this skill when converting the 井周智修 solution and demo references into a buildable PRD, user stories, page list, priorities, API/data needs, and demo acceptance criteria.
---

# Manhole Demo PRD

Read first:
- `AGENTS.md`
- `references/solution.md`
- `references/demo-requirements.md`
- `references/domain-glossary.md`
- `references/acceptance-criteria.md`

## Workflow
1. Extract the customer value: visible disease, AI judgment, repair decision, measurable acceptance.
2. Define users: municipal owner, maintenance manager, field engineer, sales/demo operator.
3. Freeze the MVP flow: map -> detail -> diagnosis -> plan -> simulation -> acceptance report.
4. Produce a page list, user stories, priority, API/data needs, and acceptance criteria.
5. Mark demo-only mock behavior separately from future production behavior.

## Output
Create or update `docs/generated/PRD.md` with:
- product goal;
- target users;
- core workflows;
- MVP and non-MVP scope;
- page inventory;
- user stories;
- API/data requirements;
- demo script;
- acceptance criteria;
- assumptions and required private assets.

Do not write business code when using this skill.
