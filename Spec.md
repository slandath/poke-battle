# Pokemon Battle Tool — Spec

> Living document for AI agents. Update when architecture changes.

## 1. Purpose

Single-page app to search PokeAPI opponents and surface type match-ups for team building.

- Search by name → display Pokemon type(s) and type effectiveness (weak / resistant / immune)
- Build and persist a 6-Pokemon team in the browser

## 2. Tech Stack

| Layer     | Choice                                                                             | Key config                                            |
| --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Framework | Vue 3 `<script setup lang="ts">`                                                   | `src/App.vue`                                         |
| Router    | `vue-router`                                                                       | `src/router/index.ts`                                 |
| Build     | Vite 7                                                                             | `vite.config.ts`                                      |
| Language  | TypeScript 5.9 strict                                                              | `tsconfig.app.json`, `erasableSyntaxOnly:true`        |
| Styling   | Tailwind CSS v4 + `@tailwindcss/vite`                                              | `src/style.css`, `vite.config.ts`                     |
| UI        | reka-ui + shadcn-vue (`src/components/ui/*`) + `lucide-vue-next`, `@remixicon/vue` | `components.json`                                     |
| Data      | PokeAPI `https://pokeapi.co`                                                       | `src/utils/api.ts`                                    |
| State     | `ref()` + `localStorage`                                                           | `src/utils/team.ts`                                   |
| Tooling   | pnpm ≥8, Node 24.x, oxlint (type-aware), oxfmt                                     | `package.json`, `oxlint.config.ts`, `oxfmt.config.ts` |

No test framework configured.

## 3. Project Structure

```
src/
  App.vue                 # Header + router-view
  main.ts                 # createApp + router mount
  router/index.ts         # routes: / → Search, /battle → Battle, /team → Team
  components/
    Header.vue, SearchForm.vue, PokemonCard.vue, PokemonCollapse.vue, MessageWrapper.vue
    ui/                   # alert, button, card, collapsible, input, label, navigation-menu, table
  views/ Search.vue, Battle.vue, Team.vue
  types/ pokemon.ts, message.ts
  utils/ api.ts, format.ts, team.ts
  lib/ utils.ts           # cn() helper
  style.css               # Tailwind entry
```

Path alias `@` → `./src` via `vite.config.ts` and `tsconfig.app.json`.

## 4. Data Model

`src/types/pokemon.ts`

```ts
Pokemon { name, types: {slot, type:{name,url}}[], sprites }
FormattedPokemon { name: string, types: string[], sprites?: string, damageRelations?: DamageRelations }
DamageRelations { doubleDamageFrom: string[], halfDamageFrom: string[], noDamageFrom: string[] }
Message { success: boolean, title: string, content?: string }
```

API contracts:

- `GET https://pokeapi.co/api/v2/pokemon/{name}` → `Pokemon`
- `GET https://pokeapi.co/api/v2/type/{name}` → `damage_relations.{double_damage_from, half_damage_from, no_damage_from}`

## 5. Data Flow

**Search flow (`src/utils/api.ts`):**

1. `SearchForm.vue` emits `search` → `Search.vue` / `Battle.vue` `handleSearch`
2. `searchPokemon(query)` fetches `pokemon/{name}`; on 404 throws `Pokemon not found`, else `API Error: {status}`
3. `fetchDamageRelations(types)` `src/utils/format.ts` parallel fetches `type/{name}`, merges `damage_relations`, dedupes, filters overlaps (`double ∩ half`, `half ∩ noDamage`)
4. `formatPokemonData` `src/utils/format.ts` capitalizes names/types, picks `front_default`
5. Result `FormattedPokemon + damageRelations` stored in `ref`, rendered via `PokemonCard.vue` + `MessageWrapper`

**Team flow (`src/utils/team.ts`):**

- `STORAGE_KEY = "pokemon-team"` in `localStorage`
- `loadTeam(): FormattedPokemon[]` – JSON parse with fallback `[]`
- `saveTeam(team)` – `JSON.stringify` → `localStorage`
- `addToTeam(pokemon): Message` – rejects if `length ≥6` or duplicate `name`
- `removeFromTeam(name): FormattedPokemon[]` – filter + persist
- Views: `Search.vue` `handleAddToTeam` (400ms loading + 2s success state), `Battle.vue` `loadTeam` on mount + table, `Team.vue` list `PokemonCollapse` with remove

Error handling: `try/catch`, `err instanceof Error`, user message via `MessageWrapper`, `loading` via `try/finally`.

## 6. Routing & Component Hierarchy

`src/App.vue` → `Header.vue` (NavigationMenu: Search/Battle/Team) + `router-view`

- `/` **Search** (`src/views/Search.vue`): `SearchForm` → `MessageWrapper` (error) → `PokemonCard` → add `Button` (states `default/loading/success`)
- `/battle` **Battle** (`src/views/Battle.vue`): `SearchForm` → `MessageWrapper` → `PokemonCard` → `Table` (team `Name | Type(s)`)
- `/team` **Team** (`src/views/Team.vue`): `PokemonCollapse` per mon (Collapsible `Trigger/Content` + remove `Button`)

`PokemonCard.vue` props `data: FormattedPokemon | null` – shows name, types, sprite, effectiveness blocks (Weak/Resistant/Immune).

`vite.config.ts` `server.host:true, port:5173` required for dev container port forwarding.

## 7. Dev Infra

- **Package manager:** pnpm (Node 24.x) `package.json`
- **Scripts:** `pnpm dev` (Vite), `pnpm build` (`vue-tsc -b && vite build`), `pnpm preview`, `pnpm lint` (`oxlint && oxfmt --check`), `pnpm lint:fix` (`oxlint --fix && oxfmt --write`), `pnpm typecheck` (`vue-tsc -b --noEmit`)
- **Lint/Format:** `oxlint.config.ts` `correctness/suspicious: error`, plugins `typescript, vue, unicorn, import, oxc, promise, node`, `typeAware/typeCheck:true`; `oxfmt.config.ts` `printWidth:100, tabWidth:2, semi:true, singleQuote:false, trailingComma:all, sortImports:true, sortTailwindcss:{entryPoint:"src/style.css"}`
- **CI:** `.github/workflows/lint.yml` `ubuntu-latest`, `node 24.x`, `pnpm/action-setup@v4`, `actions/setup-node@v4` cache pnpm, `pnpm install --frozen-lockfile`, `pnpm exec oxlint`, `pnpm exec oxfmt --check` on push/PR to `main`
- **Editor:** `.vscode/settings.json` `editor.formatOnSave:true`, `defaultFormatter: oxc.oxc-vscode`, `source.fixAll.oxc:explicit`; extensions `oxc.oxc-vscode`, `Vue.volar`
