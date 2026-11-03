# #41 — Unit Test Suite for Regression Checks

> Spec for https://github.com/slandath/poke-battle/issues/41
> Spirit: give agents a fast, DB-free command that proves "nothing broke" after every feature PR.

## 1. Problem & current state

`Spec.md:28` says "No test framework configured." Verified:

- `package.json` has no test runner, no `test` script.
- No `*.test.*` / `*.spec.*` files anywhere.
- `vitest` is not in `pnpm-lock.yaml`.
- CI (`.github/workflows/lint.yml`) runs `oxlint`, `oxfmt --check`, `pnpm typecheck` only.

Everything below is currently unverified by CI and only covered by manual QA (see `specs/034-hall-of-fame.md` §7).

## 2. Decisions (locked)

1. **Runner: `vitest`** — same Vite pipeline as the app, so `~`/`#shared` aliases and TS transforms behave like production. `node:test` + `tsx` would need a second transform/alias setup for no gain.
2. **Two projects, one command.** `unit` (`environment: node`) for pure functions; `nuxt` (`environment: nuxt` via `@nuxt/test-utils`) for composables. `pnpm test` runs both.
3. **`pnpm test` must never need Postgres, network, or env vars.** It runs on a clean checkout and in CI without secrets. Server invariants are tested against **PGlite** (in-memory Postgres/WASM), not a service container.
4. **No global coverage gate.** 100% thresholds only on the genuinely pure modules (`app/utils/format.ts`, `server/utils/versions.ts`). Requiring coverage on `server/api/**` pushes people into assertion-free tests.
5. **No `globals: true`.** Every test imports `describe/it/expect/vi` from `vitest` explicitly — keeps `oxlint` (`correctness/suspicious: error`, type-aware) happy without adding globals, and keeps `tsconfig` types untouched.
6. **Test location is dictated by the generated tsconfigs** (see §3.3): pure + composable tests in `tests/`, server/DB tests in `server/tests/`. No hand-written `tests/tsconfig.json`, no duplicated alias paths.
7. **Fix order:** #45 (type-overlap bug) lands **before** the format tests; #47 (error codes) lands **after** the composable tests that pin today's strings.

## 3. Tooling & config

### 3.1 Dependencies (devDependencies)

| Package                | Version  | Why                                                                                                             |
| ---------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `vitest`               | `^5.1.0` | Runner; peers `vite@^6.4 \|\| ^7 \|\| ^8`                                                                       |
| `@nuxt/test-utils`     | `^4.3.4` | `environment: "nuxt"`, `mockNuxtImport`, real `useState`/`watch`/`$fetch`; peers `nuxt@^4`, `vitest@^4 \|\| ^5` |
| `@vue/test-utils`      | `^2.5.1` | Runtime requirement of `@nuxt/test-utils`; the Nuxt environment fails to boot without it                        |
| `happy-dom`            | `^21`    | DOM for the `nuxt` project (**not** the app-side default; app is `ssr: false`)                                  |
| `@electric-sql/pglite` | `^0.5`   | In-memory Postgres for API invariants (`drizzle-orm/pglite` ships with the existing `drizzle-orm`)              |
| `@vitest/coverage-v8`  | `^5.1.0` | Coverage for the two pure modules only                                                                          |
| `vite`                 | `^8.2.2` | **Required change** — see §11; Nuxt 4.5 builds with Vite 8 (rolldown) and Vitest must use the same copy         |
| `@tailwindcss/vite`    | `^4.3.4` | Bumped only because 4.1.x peers `vite@^7`, while 4.3.x supports `^8`                                            |

### 3.2 `package.json` scripts

```jsonc
"test": "nuxt prepare && vitest run",     // CI + agent default: single run, non-zero exit on failure
"test:watch": "nuxt prepare && vitest",   // local dev loop
"test:coverage": "nuxt prepare && vitest run --coverage"
```

Do **not** make `test` watch mode — agents and CI will hang.

`nuxt prepare` is chained explicitly: `vitest run` alone fails on a fresh clone because the `nuxt` environment needs `.nuxt` (`#imports`, generated tsconfigs). Do not rely on a `pretest` hook — pnpm does not run pre/post scripts by default (`enable-pre-post-scripts` is off).

### 3.3 `vitest.config.ts` (root)

Use Vitest `projects` (the workspace replacement) so one command covers both environments:

```ts
import { fileURLToPath } from "node:url";

import { defineVitestProject } from "@nuxt/test-utils/config";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "#shared": fromRoot("./shared"),
            "~~": fromRoot("."),
            "@@": fromRoot("."),
            "~": fromRoot("./app"),
            "@": fromRoot("./app"),
          },
        },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.spec.ts", "server/tests/**/*.spec.ts"],
          setupFiles: ["./server/tests/helpers/setup.ts"],
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          environment: "nuxt",
          environmentOptions: {
            nuxt: {
              overrides: {
                runtimeConfig: {
                  public: { pokeApiBaseUrl: "https://poke.test/api", pokeApiVersion: "v2" },
                },
              },
            },
          },
          include: ["tests/nuxt/**/*.spec.ts"],
        },
      }),
    ],
    coverage: {
      provider: "v8",
      include: ["app/utils/format.ts", "server/utils/versions.ts"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
```

Notes:

- The `nuxt` project resolves aliases and Nuxt auto-imports itself — do not hand-roll aliases there. `environmentOptions.nuxt.overrides` sets the PokeAPI base URL instead of mocking `useRuntimeConfig`, which Nuxt itself also reads during boot.
- `server/tests/**` runs in the `unit` project (node env); PGlite needs no browser.
- `include` uses `.spec.ts` only, so helper modules under `tests/**/helpers/` are never collected as tests.

### 3.4 Typechecking the tests — verified, no separate tsconfig

`pnpm typecheck` → `vue-tsc -b tsconfig.json` builds Nuxt's four generated projects. Today, `tests/` is split across them in a way that needs exactly **one** config addition.

**Verified on this repo (`nuxt prepare`, Nuxt 4.5.2):**

1. `.nuxt/tsconfig.app.json` **already** includes `../tests/nuxt/**/*` (and `../test/nuxt/**/*`) — composable tests are typechecked with zero config.
2. `typescript.tsConfig.include` in `nuxt.config.ts` **is merged into the generated app config** (confirmed: adding `["../tests/unit/**/*"]` produced `['../tests/unit/**/*', '../test/nuxt/**/*', '../tests/nuxt/**/*']` in `.nuxt/tsconfig.app.json`).
3. It is **not** merged into `.nuxt/tsconfig.server.json`. That matters because the app project is generated with `types: []` and `lib: [ESNext, dom, dom.iterable, webworker]` — no node types. PGlite/`node:fs` server tests would fail to resolve there. Adding `types: ["node"]` to the app project to force it would leak node globals into client code (the exact thing Nuxt's project split prevents).

Therefore:

```ts
// nuxt.config.ts
typescript: {
  strict: true,
  typeCheck: true,
  tsConfig: { include: ["../tests/unit/**/*"] },
},
```

- `tests/unit/**` → app project (via the include above). Imports only `app/utils/format.ts` and `server/utils/versions.ts`, neither of which needs node types.
- `tests/nuxt/**` → app project (already included by Nuxt).
- `server/tests/**` → server project (already included via `../server/**/*` in `.nuxt/tsconfig.server.json`), which has node types, no DOM, and `#shared` aliases.

Result: full coverage of the suite by `pnpm typecheck` with **no** `tests/tsconfig.json` and no duplicated `paths`.

Guardrails:

- Keep `server/tests/` free of anything Nitro scans: `server/api`, `server/routes`, `server/middleware`, `server/plugins`, `server/utils`, `server/tasks`. A `server/tests/` directory is not scanned, and `server/utils/*.spec.ts` **must never** exist (auto-import scanning).
- Verify after adding the first server test that `pnpm build` output is unchanged in size — Nitro should not bundle `server/tests`.
- Naming: `*.spec.ts` in all three locations; helpers in `server/tests/helpers/`.

### 3.5 Lint/format

Nothing to change: `oxlint` has `env: { browser, node }` already, and `oxfmt` will format both `tests/` and `server/tests/` with the repo style (`printWidth: 100`, `sortImports: true`). Explicit `vitest` imports (decision 5) mean no new lint globals.

## 4. Test matrix

### 4.1 `tests/unit/format.spec.ts` → `app/utils/format.ts`

`formatPokemonData`

- capitalizes name and every type (`pikachu` → `Pikachu`, `["electric"]` → `["Electric"]`).
- `sprites.front_default: null` → `sprites: undefined` (not `null`, not `""`).
- multi-type order preserved (does not sort).

`resolveTypeOverlaps` — **asserts the corrected behavior from #45** (lands first; see decision 7)

- no overlap → deep-equals input **and** returns a new object (input not mutated).
- `double ∩ half` → type removed from both (2× × ½ = neutral).
- `half ∩ noDamage` → removed from `halfDamageFrom`, kept in `noDamageFrom`.
- `double ∩ noDamage` → removed from `doubleDamageFrom`, kept in `noDamageFrom` (**#45**, regression guard: Hisuian Zoroark Normal/Ghost vs Fighting).
- three-way `double ∩ half ∩ noDamage` → removed from `double` and `half`, kept in `noDamage`.
- all three lists populated, no conflicts → identity.

`mergeDamageRelations`

- empty array → three empty arrays.
- single type → capitalized passthrough.
- same type in both types' `double_damage_from` → appears once.
- cross-type conflict: type A `double_damage_from: fire`, type B `half_damage_from: fire` → `fire` in neither list (merge must call `resolveTypeOverlaps`).
- does not mutate the input `TypeDamageResponse[]`.

### 4.2 `tests/unit/versions.spec.ts` → `server/utils/versions.ts`

- `normalizeVersion`: `"red"` → `"red"`; `" Red "` / `"RED"` → `"red"`; `""` / `"   "` → `null`; `"not-a-game"` → `null`; `null` / `undefined` / `42` / `{}` / `[]` → `null`.
- `isGameVersion` narrows and agrees with `normalizeVersion` on the same fixtures.
- `GAME_VERSIONS`: no duplicates; contains `DEFAULT_GAME_VERSION`; every entry matches `/^[a-z0-9-]+$/`.
- drift guard: `DEFAULT_GAME_VERSION` equals the one exported by `app/composables/useVersions.ts` (**#46** — this test is what catches the duplicate before it bites).

### 4.3 `tests/nuxt/useTeam.spec.ts` → `app/composables/useTeam.ts`

Harness: `mockNuxtImport("navigateTo", …)`, `mockNuxtImport("$fetch", …)`, `clearNuxtState()` in `beforeEach`, and each test mounts the composable inside its own `effectScope()` that is stopped in `afterEach`.

The scope is not optional: `useTeam` registers `watch(selectedVersion)` and, called outside a component, that watcher is never disposed. Without per-test scopes, `clearNuxtState()` resets `selected-version` and every watcher accumulated by earlier tests fires a fetch — observed as `fetchMock` being called 25–31 times in a single test.

| #   | Case                             | Assert                                                                                         |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | first call, empty team           | exactly one `GET /api/teams?version=red`; `team` populated from response                       |
| 2   | first call, team non-empty       | no fetch (hydration short-circuit at `useTeam.ts:57`)                                          |
| 3   | `refresh()`                      | re-GETs current version; replaces array                                                        |
| 4   | version switch                   | setting `selectedVersion` triggers `GET ?version=scarlet`; team reflects scarlet payload       |
| 5   | stale-response race              | red response resolving after switch to scarlet is discarded (`useTeam.ts:46`)                  |
| 6   | `refresh()` 401                  | team cleared to `[]`, no throw                                                                 |
| 7   | `refresh()` 500                  | team untouched, no throw                                                                       |
| 8   | `add` success                    | `POST /api/teams` body `{ version, pokemon }`; then refetch; returns server `{success,title}`  |
| 9   | `add` → 400 "Team is full"       | `{ success: false, title: "Team is full" }`, `navigateTo` not called (**pins #47's literals**) |
| 10  | `add` → 400 "Already on team!"   | same, message preserved (**pins #47's literals**)                                              |
| 11  | `add` → 401                      | `navigateTo("/login")`, `{ success: false, title: "Sign in to add to your team" }`             |
| 12  | `add` → 503 ofetch noise         | raw `[POST] "/api/teams": 503` statusMessage is replaced by `"Database unavailable"`           |
| 13  | `remove` success                 | `DELETE /api/teams/<encoded name>?version=…`; `team` replaced by response                      |
| 14  | `remove` 401                     | `navigateTo("/login")` **and** rejects (current behavior, `useTeam.ts:97-103` — pin it)        |
| 15  | `enshrine` success               | `POST /api/teams/enshrine` body `{ version, title, notes }`; then refetch                      |
| 16  | `enshrine` → 400 "Team is empty" | passthrough message via `apiMessage`                                                           |

Cases 9–10 deliberately pin the string comparison at `useTeam.ts:75` so the **#47** refactor (codes instead of prose) has a safety net. Case 12 guards `Spec.md:99` ("surface server `message`, not raw ofetch").

### 4.4 `tests/nuxt/useVersions.spec.ts` → `app/composables/useVersions.ts`

- `useRuntimeConfig().public` mocked; loads `version?limit=100` once and populates `versions`.
- default stays `red` when present in payload.
- `red` absent → falls back to `names[0]`.
- fetch rejects → `versions` stays `[]`, no throw, `pending` back to `false`.
- `selectVersion("scarlet")` updates the shared `useState("selected-version")` (so `useTeam` sees it).
- second `loadVersions()` with a populated list does not refetch.

### 4.5 `server/tests/team-rules.spec.ts` → extracted pure rules

The 6-max / duplicate / empty-enshrine invariants are inline inside handlers and only reachable through H3 + Postgres (`server/api/teams/index.post.ts:52-58`, `enshrine.post.ts:38-40`). Extract them:

```ts
// server/utils/team-rules.ts
export type RuleResult = { ok: true } | { ok: false; statusCode: 400; message: string };
export function canAddPokemon(existing: { name: string }[], name: string): RuleResult;
export function canEnshrine(memberCount: number): RuleResult;
```

Handlers call these and keep their HTTP wrapping; tests assert the rules directly:

- `canAddPokemon([], "Pikachu")` → ok; 5 members → ok; 6 → `400 "Team is full"`; duplicate name → `400 "Already on team!"`.
- `canEnshrine(0)` → `400 "Team is empty"`; `1` / `6` → ok.

Messages stay **literals** in this PR (no constants yet) — #47 owns moving to codes + shared constants, and these tests keep passing unchanged until then.

### 4.6 `server/tests/teams-api.spec.ts` → PGlite + handler harness

Harness (`server/tests/helpers/api.ts`):

1. A setup file stubs H3/Nitro globals **before** handler modules are imported: `defineEventHandler = (fn) => fn`, `readBody = () => fixture`, `getQuery = () => fixture`, `getRouterParam = (e, k) => e.context.params?.[k]`, `createError = ({ statusCode, message }) => Object.assign(new Error(message), { statusCode })`.
2. `vi.mock` the auth + db modules: `requireSession` → configurable fake session; `useDb` → `pgliteDb`.
3. PGlite per test file: `new PGlite()` → `drizzle(pglite)` → `migrate(db, { migrationsFolder: "server/database/migrations" })`. Verify `0002_team_unique_constraints.sql` applies — the partial unique index on `(user_id, version) WHERE status='active'` is the guarantee being tested.

| Handler                        | Cases                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/teams`               | missing `version` → 400; `?version=bogus` → 400; valid → `[]` **and** an `active` row is created; second call reuses it                          |
| `POST /api/teams`              | add 6 ok, 7th → 400 "Team is full"; duplicate → 400 "Already on team!"; 401 when `requireSession` throws                                         |
| version isolation              | add to `scarlet`, then `GET ?version=red` → `[]`                                                                                                 |
| `DELETE /api/teams/:name`      | removes + returns remaining; unknown name → unchanged; no active team → `[]`; bad version → 400                                                  |
| `POST /api/teams/enshrine`     | 0 mons → 400 "Team is empty"; 2 mons → row `status='enshrined'` with `enshrined_at`/`title`/`notes`, new `active` row empty; version isolated    |
| `GET /api/hall-of-fame`        | `?version=all` (and no param) → memorials newest-first; `?version=scarlet` scopes; `?version=bogus` → 400; other users' memorials never returned |
| `DELETE /api/hall-of-fame/:id` | own enshrined → 200 + `team_pokemon` cascaded; other user's id → 404; **own `active` team id → 404**; non-integer id → 400                       |

Auth (401) is asserted once per family — `requireSession` mocking proves wiring, not Better Auth itself (out of scope).

## 5. CI

New `.github/workflows/test.yml` mirroring `lint.yml` setup (`ubuntu-latest`, node `24.x`, `pnpm/action-setup@v4` `12.3.4`, `setup-node` with `cache: pnpm`, `pnpm install --frozen-lockfile`, then `pnpm test`), triggered on push/PR to `main`.

- No `NUXT_*` dummy env needed: nothing reads `useRuntimeConfig` at import time in these tests, and the PGlite harness mocks `useDb`.
- Separate workflow vs. extra job in `lint.yml`: separate file keeps the failure signal obvious; ~6 duplicated setup lines are the accepted cost.
- Do **not** copy the dummy `DATABASE_URL` block from `lint.yml` — passing a fake connection string into PGlite tests hides misconfiguration.

## 6. Docs

- `Spec.md:28` → replace "No test framework configured." with the runner + command.
- `Spec.md` §3 structure → add `tests/{unit,nuxt}/` and `server/tests/`.
- `Spec.md` §2 stack table `Tooling` row → add Vitest.
- `Spec.md` §7 dev infra → add `pnpm test`, `test:watch`, `test:coverage`, the new CI workflow, and the `typescript.tsConfig.include` line, alongside `pnpm typecheck` / `pnpm lint`.
- `specs/034-hall-of-fame.md` §7 says "no test framework configured" — update that pointer once #41 lands.

## 7. Implementation order (each step green on its own)

0. **#45** (type-overlap fix) merges first — §4.1 asserts the corrected behavior.
1. **Tooling**: deps, `vitest.config.ts`, scripts, `nuxt.config.ts` `tsConfig.include`, `Spec.md` §7 — `pnpm test` passes with zero tests (or one smoke test).
2. **Pure units**: `tests/unit/format.spec.ts`, `tests/unit/versions.spec.ts`. Fastest feedback, no new runtime.
3. **Composables**: `tests/nuxt/useTeam.spec.ts`, `useVersions.spec.ts` with `@nuxt/test-utils` + `happy-dom`.
4. **Server rules + API**: `server/utils/team-rules.ts` extraction, `server/tests/*.spec.ts` with PGlite harness; verify `pnpm build` does not bundle `server/tests`.
5. **CI**: `.github/workflows/test.yml`.
6. **#47** (error codes) after — tests 9–10 protect the refactor.

## 8. Acceptance

- [ ] `pnpm test` runs green on a clean checkout with no `DATABASE_URL`, no network, no `.env`.
- [ ] `pnpm test` exits non-zero on any failure (single run, never watch).
- [ ] Matrix in §4.1–4.6 implemented, including the 100% threshold on `format.ts` + `versions.ts`.
- [ ] `pnpm typecheck` covers all tests (app + server projects) and passes; `pnpm lint` passes over `tests/` + `server/tests/`.
- [ ] `pnpm build` output is unchanged by the presence of `server/tests/`.
- [ ] CI runs tests on push/PR to `main`.
- [ ] `Spec.md` documents the command + test layout.
- [ ] Suite runtime target: **< 15s** locally (pure units < 1s, nuxt env ~2–5s/file, PGlite < 2s/file).

## 9. Out of scope

- E2E/browser tests (`@nuxt/test-utils` + Playwright) against a live server.
- Testing Better Auth flows, live PokeAPI responses, or Drizzle migrations beyond "they apply to PGlite".
- Coverage upload (Codecov) or PR annotations.
- Tests for #44 (game selector move) — lands with #44.
- The refactors tracked by #46 (shared version constant) and #47 (error codes) — #41 only pins current behavior.

## 10. Resolved decisions

| #   | Question                                | Decision                                                                                                                                         |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `double ∩ noDamage` overlap bug         | **Fix in #45 first**, then §4.1 asserts corrected behavior. No `test.fails`.                                                                     |
| 2   | `server/utils/team-rules.ts` extraction | **In scope for #41** — handlers stay thin, invariants become pure and DB-free to test.                                                           |
| 3   | Test typechecking strategy              | **`typescript.tsConfig.include`** (no `tests/tsconfig.json`), with server tests relocated to `server/tests/` — see §3.4 for the verified reason. |
| 4   | Error-message constants vs. literals    | **Keep literals**, pin them in tests 9–10; #47 does the codes refactor afterwards.                                                               |

### Finding behind decision 3

`typescript.tsConfig.include` merges into the generated **app** project only (verified: `.nuxt/tsconfig.app.json` gained the entry; `.nuxt/tsconfig.server.json` did not). The app project is generated with `types: []`, so it cannot typecheck PGlite/`node:fs` code. Two ways out, and the spec takes the second:

- widen the app project with `compilerOptions.types: ["node"]` — pollutes client typechecking with node globals;
- put node-dependent tests at `server/tests/**`, already included by `../server/**/*` in the server project, and keep `tests/unit/**` + `tests/nuxt/**` (already covered) in the app project.

Also verified: `.nuxt/tsconfig.app.json` ships with `../tests/nuxt/**/*` in its `include` list by default, so composable tests need no config at all.

## 11. As built

Implemented on `feature/auto-db-migrate`. `pnpm test` → **82 tests / 6 files in ~1.3s**, all projects, no DB or secrets.

| Path                              | Tests | Notes                                    |
| --------------------------------- | ----- | ---------------------------------------- |
| `tests/unit/format.spec.ts`       | 17    | includes the #45 regression case         |
| `tests/unit/versions.spec.ts`     | 12    | includes the #46 drift guard             |
| `tests/nuxt/useTeam.spec.ts`      | 17    | `effectScope` per test (see §4.3)        |
| `tests/nuxt/useVersions.spec.ts`  | 8     | runtime config via `environmentOptions`  |
| `server/tests/team-rules.spec.ts` | 10    | pure `canAddPokemon` / `canEnshrine`     |
| `server/tests/teams-api.spec.ts`  | 18    | real handlers + PGlite + migration chain |

Deviations from the plan, and why:

1. **Vite 7 → 8 at the root (and `@tailwindcss/vite` 4.3.4).** The Nuxt environment failed with `Missing field 'moduleType' / Plugin: builtin:replace`. Cause: `@nuxt/vite-builder@4.5.2` depends on `vite@^8.2.0` (rolldown) while the repo pinned `vite@^7.3.2`, so Vitest's rollup-based Vite ran Nuxt's rolldown plugins. Aligning on Vite 8 removed the second copy and the error. Nuxt was already building with Vite 8; only the stale root pin changed. `@vitest/coverage-v8` and Vitest 5 both support Vite 8.
2. **`@vue/test-utils@^2.5.1` added.** `@nuxt/test-utils` declares it as an optional peer, but the Nuxt environment throws `Could not resolve "@vue/test-utils"` without it.
3. **`server/tests/helpers/setup.ts` stubs H3 globals** (`defineEventHandler`, `createError`, `readBody`, `getQuery`, `getRouterParam`) via `vi.stubGlobal` — `defineEventHandler` runs at handler module load, so it must be stubbed before the spec's imports.
4. **`typescript/no-unsafe-type-assertion` disabled for `server/tests/**`** in `oxlint.config.ts`, matching the existing `server/api/teams/**` override: the harness builds placeholder H3 events and asserts the response shapes h3 erases.
5. **`coverage/` added to `.gitignore`**; `test:coverage` writes there.
6. **`pnpm test` chains `nuxt prepare`** — a bare `vitest run` fails on a fresh clone (verified by deleting `.nuxt`).

Verified: `pnpm test`, `pnpm test:coverage` (100% lines/branches/functions/statements on both guarded files), `pnpm typecheck` (a deliberate `const x: number = "s"` in each of `tests/unit`, `tests/nuxt`, `server/tests` fails the build, so all three locations are really covered), `pnpm lint`.
