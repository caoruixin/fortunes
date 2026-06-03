---
name: manhole-devops-local-runner
description: Use this skill when configuring Docker Compose, environment variables, seed scripts, one-command local startup, reset scripts, and README startup instructions for the 井周智修 demo.
---

# Manhole DevOps Local Runner

Read first:
- `AGENTS.md`
- `docs/generated/ARCHITECTURE.md` if it exists;
- current frontend/backend/database files.

## Required Delivery
- `docker-compose.yml`;
- frontend Dockerfile;
- backend Dockerfile;
- `.env.example`;
- migration and seed startup path;
- reset data command;
- README startup and troubleshooting instructions.

## Target Startup

```bash
cp .env.example .env
docker compose up --build
```

Target URL:

```text
http://localhost:3000
```

## Rules
1. Keep local setup friendly for non-developers.
2. Avoid secrets in repo.
3. Make seed data deterministic.
4. Add a smoke test or documented verification path.

## Return
- changed infra files;
- startup command tested;
- environment assumptions;
- remaining deployment risks.
