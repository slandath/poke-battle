# Pokemon Battle Tool — Spec

> Living document for AI agents. Update when architecture changes.

## 1. Purpose

Single-page app to search PokeAPI opponents and surface type match-ups for team building.

- Search by name → display Pokemon type(s) and type effectiveness (weak / resistant / immune)
- Sign in (GitHub or email/password) and persist a 6-Pokemon team in Postgres

## 2. Tech Stack

| Layer     | Choice                                                                             | Key config                                                                |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Framework | Nuxt 4 (Vue 3 `<script setup lang="ts">`)                                          | `app/app.vue`                                                             |
| Router    | Nuxt file-based (`app/pages/`)                                                     | `app/pages/index.vue`, `battle.vue`, `team.vue`, `login.vue`              |
| Build     | Nuxt + Vite                                                                        | `nuxt.config.ts`                                                          |
| Language  | TypeScript 5.9 strict                                                              | `nuxt.config.ts` `typescript.strict/typeCheck`                            |
| Styling   | Tailwind CSS v4 + `@tailwindcss/vite`                                              | `app/assets/css/main.css`, `nuxt.config.ts`                               |
| UI        | reka-ui + shadcn-vue (`app/components/ui/*`) + `lucide-vue-next`, `@remixicon/vue` | `components.json`                                                         |
| Data      | PokeAPI `https://pokeapi.co`                                                       | `app/utils/api.ts`                                                        |
| Auth      | Better Auth (GitHub + email/password)                                              | `server/utils/auth.ts`, `app/utils/auth-client.ts`                        |
| DB        | Postgres + Drizzle (`team`, `team_pokemon`)                                        | `server/database/schema.ts`, `server/utils/db.ts`                         |
| State     | `useState` + `/api/teams` via `useTeam`, game version via `useVersions`            | `app/composables/useTeam.ts`, `app/composables/useVersions.ts`            |
| Tooling   | pnpm ≥8, Node 24.x, oxlint (type-aware), oxfmt, Vitest + PGlite                    | `package.json`, `oxlint.config.ts`, `oxfmt.config.ts`, `vitest.config.ts` |

Tests: `pnpm test` (Vitest, two projects: `unit` node env, `nuxt` env). Pure functions in `tests/unit/`, composables in `tests/nuxt/`, API/DB invariants in `server/tests/` against in-memory Postgres (PGlite). No DB, network, or env vars required.

## 3. Project Structure

```
app/
  app.vue                 # Header + NuxtPage
  pages/ index.vue, battle.vue, team.vue, login.vue
  components/
    Header.vue, SearchForm.vue, PokemonCard.vue, PokemonCollapse.vue, MessageWrapper.vue
    ui/                   # alert, button, card, collapsible, input, label, navigation-menu, table
  composables/ useTeam.ts, useAuth.ts, usePokemonSearch.ts, useVersions.ts
  utils/ api.ts (PokeAPI HTTP + searchPokemon), apiConfig.ts (endpoints), format.ts (pure formatting), auth-client.ts
  lib/ utils.ts           # cn() helper
  assets/css/main.css     # Tailwind entry
server/
  api/auth/[...all].ts    # Better Auth handler
  api/teams/              # GET/POST index (version-scoped active), DELETE [name], POST enshrine
  api/hall-of-fame/       # GET index (?version=all|slug), DELETE [id]
  database/schema.ts      # team (version/status/enshrined_at/title/notes) + team_pokemon
  utils/auth.ts, db.ts, teams.ts (active-team getOrCreate), versions.ts (allowlist)
shared/
  types/ pokemon.ts, message.ts
tests/
  unit/                   # pure functions (format.ts, versions.ts, team-rules.ts)
  nuxt/                   # composables under the Nuxt test environment
server/tests/             # API handlers + invariants against PGlite
  helpers/                # H3 global stubs, PGlite bootstrap, request/session fixtures
```

Aliases: `~`/`@` → `app/`, `~~`/`@@` → root, `#shared` → `shared/` via `nuxt.config.ts` / `.nuxt/tsconfig`.

## 4. Data Model

`shared/types/pokemon.ts`

```ts
Pokemon { name, types: {slot, type:{name,url}}[], sprites }
FormattedPokemon { name: string, types: string[], sprites?: string, damageRelations?: DamageRelations }
DamageRelations { doubleDamageFrom: string[], halfDamageFrom: string[], noDamageFrom: string[] }
Message { success: boolean, title: string, content?: string }
```

API contracts:

- `GET {NUXT_PUBLIC_POKE_API_BASE_URL}/{NUXT_PUBLIC_POKE_API_VERSION}/pokemon/{name}` → `Pokemon`
- `GET {NUXT_PUBLIC_POKE_API_BASE_URL}/{NUXT_PUBLIC_POKE_API_VERSION}/type/{name}` → `damage_relations.{double_damage_from, half_damage_from, no_damage_from}`
- `GET/POST /api/teams?version=`, `DELETE /api/teams/:name?version=` — session required (401 unauthenticated, 503 DB down, 400 missing/invalid version); operate on the **active** roster for `(userId, version)`
- `POST /api/teams/enshrine {version, title?, notes?}` — freezes the active roster to `enshrined` and starts a fresh active team (400 when active team empty)
- `GET /api/hall-of-fame?version=<slug|all>`, `DELETE /api/hall-of-fame/:id` — read/delete enshrined memorials (404 not owned / not enshrined)
- `/api/auth/*` — Better Auth (GitHub callback `/api/auth/callback/github`)

## 5. Data Flow

**Search flow (`app/utils/api.ts` + `app/composables/usePokemonSearch.ts`):**

1. `SearchForm.vue` emits `search` → `pages/index.vue` / `pages/battle.vue` call `usePokemonSearch().search`
2. `searchPokemon(query)` (`app/utils/api.ts`) via `$fetch` (`ofetch`); on 404 throws `Pokemon not found`, else `API Error: {statusCode}`
3. `fetchPokemon` then `fetchTypeDamage(types)` parallel `$fetch` `type/{name}` — endpoints from `getPokeApiEndpoints()` (`app/utils/apiConfig.ts`), backed by `runtimeConfig.public.pokeApiBaseUrl`/`pokeApiVersion`
4. `mergeDamageRelations` `app/utils/format.ts` (pure) merges `damage_relations`, dedupes, then `resolveTypeOverlaps` filters conflicts (`double ∩ half`, `half ∩ noDamage`)
5. `formatPokemonData` `app/utils/format.ts` (pure) capitalizes names/types, picks `front_default`
6. Result `FormattedPokemon + damageRelations` held in `usePokemonSearch` state, rendered via `PokemonCard.vue` + `MessageWrapper`

**Auth flow:**

- Client: `createAuthClient` from `better-auth/vue` in `app/utils/auth-client.ts`
- `useAuth()` — session, user, signIn/signUp/signOut
- `/login` — GitHub OAuth + email/password
- Header shows Sign in or user name + Sign out

**Team flow (`app/composables/useTeam.ts` + `app/composables/useVersions.ts`):**

- One **active** roster per `(user, game version)`; `version` is a PokeAPI version slug validated against a static allowlist (`server/utils/versions.ts`)
- Version `<select>` in `Header.vue` (signed in only), held in `useState("selected-version")` (default `red`), not localStorage
- `useTeam()` — global `useState("team")` for the selected version's active roster, auto-refreshes on version switch; `refresh` via `GET /api/teams?version=`, `addToTeam` `POST /api/teams {version, pokemon}`, `removeFromTeam` `DELETE /api/teams/:name?version=`, `enshrineTeam` `POST /api/teams/enshrine`
- Requires Better Auth session; `team` rows are `active` or `enshrined` (partial unique on `(user_id, version)` where active, unlimited memorials); `team_pokemon` max 6 per team, unique name per team
- Unauthenticated add → `/login`; 401 clears team; surface server `message` (not raw ofetch `[POST] "/api/teams": 500`)
- Views: `pages/index.vue` `handleAddToTeam` (400ms loading + 2s success; Sign in to add if logged out), `pages/battle.vue` `team` + table, `pages/team.vue` list `PokemonCollapse` with remove + enshrine form (title/notes) → `/hall-of-fame`, `pages/hall-of-fame.vue` read-only memorials grouped by version with delete

Error handling: `try/catch`, `err instanceof Error`, user message via `MessageWrapper`, `loading` via `try/finally`.

## 6. Routing & Component Hierarchy

`app/app.vue` → `Header.vue` (auth + NavigationMenu: Search/Battle/Team) + `NuxtPage`

- `/` **Search** (`app/pages/index.vue`): `SearchForm` → `MessageWrapper` (error) → `PokemonCard` → add `Button` (states `default/loading/success`)
- `/battle` **Battle** (`app/pages/battle.vue`): `SearchForm` → `MessageWrapper` → `PokemonCard` → `Table` (team `Name | Type(s)`)
- `/team` **Team** (`app/pages/team.vue`): `PokemonCollapse` per mon (Collapsible `Trigger/Content` + remove `Button`) + enshrine form → `/hall-of-fame`
- `/hall-of-fame` **Hall of Fame** (`app/pages/hall-of-fame.vue`): version filter + read-only memorials with delete
- `/login` **Sign in** (`app/pages/login.vue`): GitHub + email/password

`PokemonCard.vue` props `data: FormattedPokemon | null` – shows name, types, sprite, effectiveness blocks (Weak/Resistant/Immune).

All `app/components` auto-imported (`components: [{path:"~/components", pathPrefix:false, ignore:["**/index.ts"]}]`), `app/utils` and `app/composables` auto-imported (`searchPokemon`, `useTeam`, `useAuth`).

## 7. Dev Infra

- **Package manager:** pnpm (Node 24.x) `package.json`
- **Scripts:** `pnpm dev` (`nuxt dev`), `pnpm build` (`nuxt build`), `pnpm preview` (`nuxt preview`), `pnpm lint` (`oxlint && oxfmt --check`), `pnpm lint:fix` (`oxlint --fix && oxfmt --write`), `pnpm typecheck` (`nuxt typecheck`), `pnpm test` (`nuxt prepare && vitest run`), `pnpm test:watch` (`vitest`), `pnpm test:coverage` (`vitest run --coverage`), `pnpm db:migrate` (`drizzle-kit migrate`)
- **Tests (see `specs/041-unit-test-suite.md`):** `vitest.config.ts` declares two projects — `unit` (`environment: node`, includes `tests/unit/**` + `server/tests/**`, setup stubs H3/Nitro globals) and `nuxt` (`environment: nuxt` via `@nuxt/test-utils`, includes `tests/nuxt/**`, runtime config overridden to `https://poke.test/api`). Server API tests run handlers directly against PGlite with the real migration chain (`0003_nebulus_shaman` partial unique index included); auth/db modules are mocked per spec file. `pnpm test` needs no `DATABASE_URL`. Coverage threshold is 100% on `app/utils/format.ts` + `server/utils/versions.ts` only.
- **Typecheck coverage of tests:** `.nuxt/tsconfig.app.json` already includes `../tests/nuxt/**/*`; `nuxt.config.ts` `typescript.tsConfig.include` adds `../tests/unit/**/*` to the same project; `server/tests/**` is covered by the server project's `../server/**/*`. Do not add `*.spec.ts` under `server/utils/` (auto-import scanning) or anywhere Nitro scans.
- **Lint/Format:** `oxlint.config.ts` `correctness/suspicious: error`, plugins `typescript, vue, unicorn, import, oxc, promise, node`, `typeAware/typeCheck:true`, ignores `.nuxt/.output/.data`; `oxfmt.config.ts` `printWidth:100, tabWidth:2, semi:true, singleQuote:false, trailingComma:all, sortImports:true, sortTailwindcss:{entryPoint:"app/assets/css/main.css"}`
- **CI:** `.github/workflows/lint.yml` `ubuntu-latest`, `node 24.x`, `pnpm/action-setup@v4`, `actions/setup-node@v4` cache pnpm, `pnpm install --frozen-lockfile`, `pnpm exec oxlint`, `pnpm exec oxfmt --check`, `pnpm typecheck` on push/PR to `main`; `.github/workflows/test.yml` runs `pnpm test` on the same triggers with no DB service or secrets.
- **Editor:** `.vscode/settings.json` `editor.formatOnSave:true`, `defaultFormatter: oxc.oxc-vscode`, `source.fixAll.oxc:explicit`; extensions `oxc.oxc-vscode`, `Vue.volar`
- **Dev server:** `nuxt.config.ts` `devServer.host:"0.0.0.0", port:5173` for container port forwarding
- **Config:** `nuxt.config.ts` `runtimeConfig.public.pokeApiBaseUrl`/`pokeApiVersion` (defaults `https://pokeapi.co/api`, `v2`), overridable via `NUXT_PUBLIC_POKE_API_BASE_URL`/`NUXT_PUBLIC_POKE_API_VERSION`; consumed by `app/utils/apiConfig.ts`. Other env in `.env.example` (`DATABASE_URL`, `BETTER_AUTH_*`, `GITHUB_*`)
- **DB:** `server/utils/db.ts` SSL off for `*.railway.internal` / localhost; `{ rejectUnauthorized: false }` for public hosts. Runtime `DATABASE_URL` or `NUXT_DATABASE_URL`. Pending migrations auto-apply on boot (`server/plugins/01.db-migrate.ts`, skipped when no DB configured); `pnpm db:migrate` for manual runs.
