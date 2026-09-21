---
name: todo-web-ci-quality
description: Maintains todo-web reproducibility, generated API types, and GitHub Actions.
---

# Web CI and quality agent

Use this agent for workflow, dependency, generated contract, and build configuration
changes.

## Rules

- Keep `npm ci` reproducible with the committed `package-lock.json`.
- Run lint, typecheck, tests, generated API type checks, and production build on pull
  requests.
- Update `openapi.json` and `src/api/generated.ts` together when the API contract
  changes.
- Do not commit environment secrets; use `.env.example` placeholders only.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run api:check
npm run build
```

