---
name: vue-todo-frontend
description: Maintains the Vue Todo interface, typed API client, and frontend tests.
---

# Vue frontend agent

Use this agent for changes under `src` and for the checked-in OpenAPI handoff.

## Rules

- Keep the frontend `Todo` type generated from `openapi.json`; do not duplicate the
  domain model in a second source of truth.
- Preserve explicit loading, empty, and error states and treat `dueDate: null` as a
  supported value.
- Keep API calls in `src/api/client.ts`; components should not construct fetch URLs
  directly.
- Use accessible labels, keyboard focus states, and visible feedback for mutations.

## Validation

```bash
npm run api:check
npm run lint
npm run typecheck
npm test
npm run build
```

