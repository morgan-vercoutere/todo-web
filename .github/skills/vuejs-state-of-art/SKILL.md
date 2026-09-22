---
name: vuejs-state-of-art
description: Build and maintain modern Vue 3 applications with TypeScript, Vite, accessible interfaces, typed data boundaries, predictable state, and reliable tests. Use for Vue components, composables, routing, state management, API integration, performance, and frontend quality work.
---

# Vue.js state of the art

Use this skill for Vue 3 work. Prefer the current project conventions over
fashionable abstractions, and verify version-specific behavior against the
project's installed dependencies and the official documentation. For new code,
the default stack is Vue 3, Composition API, `<script setup lang="ts">`, strict
TypeScript, and Vite unless the repository explicitly uses another framework
such as Nuxt.

## First inspect the repository

Before editing:

1. Read `AGENTS.md`, the relevant `.github/agents/*.agent.md` files, and the
   package scripts.
2. Inspect the working-tree diff and identify the exact files and behavior in
   scope.
3. Reuse the existing architecture, API client, test helpers, naming, and
   styling conventions. Do not introduce a new state library, router pattern,
   formatter, or dependency without an explicit decision.
4. Keep UI work in the repository's component/view locations, reusable logic in
   composables, and network concerns in the API layer.

For an existing application, preserve a working Options API surface unless the
task calls for migration. Do not rewrite unrelated components merely to
standardize syntax.

## Component and Composition API design

- Use Vue's Composition API for new components, composables, and application
  logic; prefer `<script setup lang="ts">` for new single-file components.
- Type `defineProps`, `defineEmits`, slots, exposed methods, refs, computed
  values, composables, and API results. Use discriminated unions and
  `satisfies` where they make boundary contracts clearer.
- Prefer composing several small, cohesive components with clear props, slots,
  and events over one large component. Extract a component when it has a
  distinct responsibility, reusable UI, independent state, or an independently
  testable behavior; avoid both monoliths and needless fragmentation of trivial
  markup.
- Keep data flow one-way: props are inputs, emits are events, and a child must
  not mutate a prop. Use `defineModel` only when a two-way binding is the
  intentional public contract.
- Keep components focused on rendering and interaction. Move reusable state
  transitions, asynchronous work, and lifecycle cleanup into narrowly scoped
  `useX` composables.
- Use `ref` for scalar or replaceable values and `reactive` for cohesive
  objects. Do not destructure a reactive object without `toRefs`/`toRef`, and
  avoid exposing mutable internals unnecessarily.
- Keep computed getters pure and derived. Use `watch`/`watchEffect` for
  side-effects only, with explicit sources and cleanup for subscriptions,
  timers, and requests. Avoid deep watchers unless the complete traversal is
  intentional and measured.
- Do not hide errors with `any`, broad casts, empty catches, or success-shaped
  fallback values. Narrow `unknown` data at external boundaries.
- Keep templates declarative. Extract complex expressions into named computed
  values or methods, and use stable keys for `v-for`; never use an array index
  when the item has a stable identity.

## State, routing, and reactivity

- Start with local component state. Promote state to a composable when logic is
  reused, and to Pinia only when state is shared across distant components,
  routes, or application sessions. Do not put every form field in a global
  store.
- Treat server state, URL state, and client-only UI state as different
  concerns. Define ownership, cache lifetime, invalidation, and loading/error
  semantics before adding a store.
- Use `useRoute()` and `useRouter()` inside setup code rather than
  `this.$route`/`this.$router`. Read only the route fields a view needs and
  watch those fields instead of the whole route object.
- When filters, sorting, or pagination live in the URL, use a documented,
  deterministic, round-trippable parser/serializer. Normalize missing or
  invalid values to safe defaults, keep defaults stable, and prevent navigation
  loops. Never send `NaN`, `undefined`, negative pages, invalid dates, or
  unbounded page sizes to an API.
- Use typed route parameters when the project's router setup supports them.
  Keep navigation guards narrow, explicit, and testable.
- Use `shallowRef`, `markRaw`, or other reactivity escape hatches only for a
  measured reason. Document the ownership and update semantics when bypassing
  deep reactivity.

## API and asynchronous behavior

Keep HTTP calls, URL construction, request/response mapping, and API error
normalization in the API client. Components and views must not call `fetch`
directly or construct API URLs.

- Derive domain models from the checked-in API contract or shared API aliases;
  do not create a second source of truth. Generated files are regenerated by
  their tool and are never hand-edited.
- Validate and narrow API responses at the boundary. Keep transport errors
  distinguishable from validation errors and expose actionable feedback to the
  user.
- Preserve valid `null` values through display, editing, submission, clearing,
  and rollback. Never turn a valid nullable field into an invalid date,
  `undefined`, or an accidental default.
- Keep loading, empty, and error states distinct. A failed request must not
  render as an empty successful result.
- Track pending and error state per operation and target (for example, list
  loading, create, update, toggle, and delete) instead of one global boolean.
  Disable or deduplicate only the same action while it is pending so unrelated
  controls remain usable.
- Associate each request and mutation with its relevant route/filter/item
  identity or version. Abort work when the client supports it, clean up
  watchers, and ignore stale success or error responses so an older request
  cannot overwrite newer state.
- Use optimistic updates only when the operation is safe to predict. Snapshot
  the exact prior state, update immutably, reconcile with the server on
  success, and restore the snapshot plus visible error on failure.
- Use `nextTick`, `flushPromises`, controlled promises, and fake timers in
  tests when timing matters; do not rely on arbitrary sleeps.

## Accessibility and interaction quality

Accessibility is part of the component contract, not a final polish step.

- Prefer semantic HTML and native controls before adding ARIA. Every control
  needs an accessible name; labels must be associated with their inputs.
- Make every interaction keyboard-operable, provide visible focus states, and
  preserve predictable focus after route changes, dialogs, validation failures,
  and destructive actions.
- Expose pending, success, and failure feedback through text and appropriate
  `aria-live`/status semantics; never communicate state through color alone.
- Keep validation messages actionable and associate them with the invalid
  control. Do not remove a usable form or action merely because a request is
  pending.
- Test keyboard flows, disabled duplicate actions, error recovery, and
  optimistic rollback, not only snapshots. Add automated accessibility checks
  with the repository's established test or browser tooling when available.

## Performance and security

Measure before optimizing. Use the browser profiler, bundle output, and real
user metrics to identify the bottleneck.

- Lazy-load route views and genuinely heavy components with dynamic imports.
- Keep props stable, avoid unnecessary reactive depth and broad watchers, and
  virtualize very large collections when measurement justifies it.
- Use `v-once`, `v-memo`, `shallowRef`, or `markRaw` only when their trade-offs
  are understood and the measured workload benefits.
- For SSR or pre-rendered applications, keep initial state deterministic,
  avoid browser-only globals during server evaluation, and prevent hydration
  mismatches.
- Never render untrusted HTML with `v-html` without a trusted sanitization
  policy. Do not place secrets in client bundles, and treat route/query/form
  input as untrusted data.

## Testing and engineering quality

- For Vue unit and component tests, use Vitest as the test runner and Vue Test
  Utils as the component harness. Test observable behavior, emitted events,
  composable state transitions, API failure paths, accessibility semantics,
  and recovery—not implementation details.
- Prefer deterministic tests for loading, empty, error, stale-response,
  pending, duplicate-action, invalid-input, and rollback paths.
- Maintain at least 80% global test coverage. When the project supports
  coverage thresholds, enforce this minimum in CI rather than treating
  coverage as an advisory metric.
- Use browser-level tests such as Playwright when behavior depends on real
  navigation, focus, layout, or browser APIs and the repository has that
  tooling.
- Run the smallest relevant checks, then escalate for shared clients,
  configuration, or build/type changes. The normal quality gates are the
  project's lint, typecheck, test, API-contract check, and production build
  scripts.
- Keep ESLint (including Vue rules), Prettier, Vue language tooling
  (`vue-tsc` where used), and CI configuration aligned. Do not change
  dependencies or lockfiles without explicit approval.

## `todo-web` repository profile

When this skill is used in `todo-web`, also apply these repository-specific
invariants:

- Keep UI changes in `src/components` and `src/views`, reusable logic in
  `src/composables`, and HTTP integration in `src/api/client.ts`.
- Treat `openapi.json` as the API contract. Regenerate
  `src/api/generated.ts` with `npm run api:types`; never hand-edit generated
  types, and verify synchronization with `npm run api:check`.
- Reuse aliases from `src/api/types.ts` for `Todo` and other API models.
- Preserve distinct loading, empty, and error states and show visible,
  accessible feedback for failed mutations.
- Preserve `dueDate: null` exactly through display, editing, submission,
  clearing, and rollback.
- Before handoff, run the applicable existing scripts:

  ```bash
  npm run api:check
  npm run lint
  npm run typecheck
  npm run test
  npm run build
  ```

Report the exact checks run, checks not run, changed files, assumptions,
remaining risks, and any separate approval needed. Do not claim an unexecuted
check passed.

## Official references

Use these primary references for version-specific details and revisit them as
Vue tooling evolves:

- Vue introduction: <https://vuejs.org/guide/introduction.html>
- Vue and TypeScript: <https://vuejs.org/guide/typescript/overview.html>
- Composition API with TypeScript:
  <https://vuejs.org/guide/typescript/composition-api.html>
- Composables: <https://vuejs.org/guide/reusability/composables.html>
- Watchers and cleanup: <https://vuejs.org/guide/essentials/watchers.html>
- State management: <https://vuejs.org/guide/scaling-up/state-management.html>
- Accessibility: <https://vuejs.org/guide/best-practices/accessibility.html>
- Performance: <https://vuejs.org/guide/best-practices/performance.html>
- Security: <https://vuejs.org/guide/best-practices/security.html>
- Vue Router Composition API:
  <https://router.vuejs.org/guide/advanced/composition-api.html>
- Vue Router typed routes:
  <https://router.vuejs.org/guide/advanced/typed-routes.html>
- Pinia: <https://pinia.vuejs.org/introduction.html>
- Vite: <https://vite.dev/guide/>
- Vitest: <https://vitest.dev/guide/>
