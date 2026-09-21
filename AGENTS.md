# Web contribution guide

## Scope

- This repository is the Vue 3 web client, using TypeScript and Vite. Keep web
  guidance here; do not add NestJS, Prisma, or migration instructions.
- Read the focused guidance in `.github/agents/vue-frontend.agent.md` and
  `.github/agents/ci-quality.agent.md` when the change matches it. Keep this
  file cross-tool and prescriptive rather than duplicating those documents.
- Keep UI work in `src/components` and `src/views`, API integration in `src/api`,
  and follow the existing Vue and TypeScript patterns.

## API contract and client

- Treat `openapi.json` as the checked-in API contract. Keep it and the generated
  `src/api/generated.ts` output synchronized; do not hand-edit generated types
  or silently change the contract.
- Regenerate types with `npm run api:types`, then verify synchronization with
  `npm run api:check`. Review intentional contract changes before applying them.
- Reuse the API-derived aliases from `src/api/types.ts`; do not create a second
  source of truth for `Todo` or other API models.
- Put HTTP calls and URL construction in `src/api/client.ts`. Components and
  views must call the client instead of constructing URLs or calling `fetch`
  directly.

## Interface behavior

- Preserve distinct loading, empty, and error states, with actionable and
  visible feedback for failed mutations.
- Keep controls usable by keyboard and expose accessible labels, focus states,
  roles, and status feedback when adding or changing UI.
- Treat `dueDate: null` as a valid API value. Preserve it when displaying,
  editing, submitting, and clearing a todo; do not turn it into an invalid date.

## Dependencies and checks

- Do not install or update a dependency, or change `package.json` or
  `package-lock.json`, without an explicit decision first. Prefer the existing
  toolchain and keep approved dependency changes reproducible.
- Before handoff, run the applicable verified scripts:
  `npm run api:check`, `npm run lint`, `npm run typecheck`, `npm run test`, and
  `npm run build`.
