# Pokemon Battle Tool — Spec

> Living document for AI agents. Update when architecture changes.

## 1. Purpose

Single-page app to search PokeAPI opponents and surface type match-ups for team building.

- Search by name → display Pokemon type(s) and type effectiveness (weak / resistant / immune)
- Build and persist a 6-Pokemon team in the browser

## 2. Tech Stack

| Layer     | Choice                                                                             | Key config                                            |
| --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Framework | Nuxt 4 (Vue 3 `<script setup lang="ts">`)                                          | `app/app.vue`                                         |
| Router    | Nuxt file-based (`app/pages/`)                                                     | `app/pages/index.vue`, `battle.vue`, `team.vue`       |
| Build     | Nuxt + Vite                                                                        | `nuxt.config.ts`                                      |
| Language  | TypeScript 5.9 strict                                                              | `nuxt.config.ts` `typescript.strict/typeCheck`        |
| Styling   | Tailwind CSS v4 + `@tailwindcss/vite`                                              | `app/assets/css/main.css`, `nuxt.config.ts`           |
| UI        | reka-ui + shadcn-vue (`app/components/ui/*`) + `lucide-vue-next`, `@remixicon/vue` | `components.json`                                     |
| Data      | PokeAPI `https://pokeapi.co`                                                       | `app/utils/api.ts`                                    |
| State     | `useState` + `localStorage` via `useTeam`                                          | `app/composables/useTeam.ts`                          |
| Tooling   | pnpm ≥8, Node 24.x, oxlint (type-aware), oxfmt                                     | `package.json`, `oxlint.config.ts`, `oxfmt.config.ts` |

No test framework configured.

## 3. Project Structure

```
app/
  app.vue                 # Header + NuxtPage
  pages/ index.vue, battle.vue, team.vue
  components/
    Header.vue, SearchForm.vue, PokemonCard.vue, PokemonCollapse.vue, MessageWrapper.vue
    ui/                   # alert, button, card, collapsible, input, label, navigation-menu, table
  composables/ useTeam.ts # global team state (useState) + localStorage
  utils/ api.ts, format.ts # $fetch
  types/ pokemon.ts, message.ts
  lib/ utils.ts           # cn() helper
  assets/css/main.css     # Tailwind entry
shared/
  types/ pokemon.ts, message.ts
```

Aliases: `~`/`@` → `app/`, `~~`/`@@` → root, `#shared` → `shared/` via `nuxt.config.ts` / `.nuxt/tsconfig`.

## 4. Data Model

`shared/types/pokemon.ts` (also duplicated `app/types/`)

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

**Search flow (`app/utils/api.ts`):**

1. `SearchForm.vue` emits `search` → `pages/index.vue` / `pages/battle.vue` `handleSearch`
2. `searchPokemon(query)` via `$fetch` (`ofetch`); on 404 throws `Pokemon not found`, else `API Error: {statusCode}`
3. `fetchDamageRelations(types)` `app/utils/format.ts` parallel `$fetch` `type/{name}`, merges `damage_relations`, dedupes, filters overlaps (`double ∩ half`, `half ∩ noDamage`)
4. `formatPokemonData` `app/utils/format.ts` capitalizes names/types, picks `front_default`
5. Result `FormattedPokemon + damageRelations` stored in `ref`, rendered via `PokemonCard.vue` + `MessageWrapper`

**Team flow (`app/composables/useTeam.ts`):**

- `STORAGE_KEY = "pokemon-team"` in `localStorage` (client-only `import.meta.client`)
- `loadTeam(): FormattedPokemon[]` – JSON parse with fallback `[]`
- `saveTeam(team)` – `JSON.stringify` → `localStorage`
- `addToTeam(pokemon): Message` – rejects if `length ≥6` or duplicate `name`
- `removeFromTeam(name): FormattedPokemon[]` – filter + persist
- `useTeam()` – global `useState("team")` singleton, `team` ref + `addToTeam`/`removeFromTeam`/`refresh`
- Views: `pages/index.vue` `handleAddToTeam` (400ms loading + 2s success), `pages/battle.vue` `team` + table, `pages/team.vue` list `PokemonCollapse` with remove

Error handling: `try/catch`, `err instanceof Error`, user message via `MessageWrapper`, `loading` via `try/finally`.

## 6. Routing & Component Hierarchy

`app/app.vue` → `Header.vue` (NavigationMenu: Search/Battle/Team) + `NuxtPage`

- `/` **Search** (`app/pages/index.vue`): `SearchForm` → `MessageWrapper` (error) → `PokemonCard` → add `Button` (states `default/loading/success`)
- `/battle` **Battle** (`app/pages/battle.vue`): `SearchForm` → `MessageWrapper` → `PokemonCard` → `Table` (team `Name | Type(s)`)
- `/team` **Team** (`app/pages/team.vue`): `PokemonCollapse` per mon (Collapsible `Trigger/Content` + remove `Button`)

`PokemonCard.vue` props `data: FormattedPokemon | null` – shows name, types, sprite, effectiveness blocks (Weak/Resistant/Immune).

All `app/components` auto-imported (`components: [{path:"~/components", pathPrefix:false, ignore:["**/index.ts"]}]`), `app/utils` and `app/composables` auto-imported (`searchPokemon`, `useTeam`).

## 7. Dev Infra

- **Package manager:** pnpm (Node 24.x) `package.json`
- **Scripts:** `pnpm dev` (`nuxt dev`), `pnpm build` (`nuxt build`), `pnpm preview` (`nuxt preview`), `pnpm lint` (`oxlint && oxfmt --check`), `pnpm lint:fix` (`oxlint --fix && oxfmt --write`), `pnpm typecheck` (`nuxt typecheck`)
- **Lint/Format:** `oxlint.config.ts` `correctness/suspicious: error`, plugins `typescript, vue, unicorn, import, oxc, promise, node`, `typeAware/typeCheck:true`, ignores `.nuxt/.output/.data`; `oxfmt.config.ts` `printWidth:100, tabWidth:2, semi:true, singleQuote:false, trailingComma:all, sortImports:true, sortTailwindcss:{entryPoint:"app/assets/css/main.css"}`
- **CI:** `.github/workflows/lint.yml` `ubuntu-latest`, `node 24.x`, `pnpm/action-setup@v4`, `actions/setup-node@v4` cache pnpm, `pnpm install --frozen-lockfile`, `pnpm exec oxlint`, `pnpm exec oxfmt --check`, `pnpm typecheck` on push/PR to `main`
- **Editor:** `.vscode/settings.json` `editor.formatOnSave:true`, `defaultFormatter: oxc.oxc-vscode`, `source.fixAll.oxc:explicit`; extensions `oxc.oxc-vscode`, `Vue.volar`
- **Dev server:** `nuxt.config.ts` `devServer.host:"0.0.0.0", port:5173` for container port forwarding
