# #34 — Hall of Fame: One Team Per Game + Enshrined Winners

> Spec for https://github.com/slandath/poke-battle/issues/34
> Spirit: enshrine the 6-Pokémon team the user beat a game with. Active roster per game + immutable Hall of Fame memorials.

## 1. Decisions (locked)

1. Multiple enshrined teams per `(user, version)` allowed (repeat playthroughs).
2. Enshrine requires 1–6 mons on the active team. `title` and `notes` optional.
3. Enshrined rows are deletable (delete memorial only; no per-Pokémon add/remove on enshrined rows).

## 2. Game identity

- `version` = PokeAPI `version.name` (`red`, `sword`, `scarlet`, …).
- Source: `GET https://pokeapi.co/api/v2/version?limit=100`.
- Invalid/unknown slug → `400`. Validation strategy (pick one at implementation):
  - (a) static allowlist refreshed from PokeAPI, or
  - (b) live-validate + cache. Prefer (a): avoids server-side PokeAPI dependency on every write.

## 3. Schema (`server/database/schema.ts`)

```ts
// team gains: version, status, enshrinedAt, title, notes
export const team = pgTable("team", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  status: text("status").notNull().default("active"), // 'active' | 'enshrined'
  enshrinedAt: timestamp("enshrined_at"),
  title: text("title"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Constraints (require raw SQL migration — Drizzle `pgTable` cannot express partial uniques):

- Drop legacy `UNIQUE(user_id)` (`team_user_id_unique`, see `server/database/migrations/0002_team_unique_constraints.sql`).
- Add partial unique: `UNIQUE(user_id, version) WHERE status = 'active'` → guarantees one active roster per game, unlimited enshrined.
- `team_pokemon` unchanged (`team_pokemon_team_id_name_unique` on `(team_id, name)` stays).

Migration (`drizzle-kit generate` + hand-edit):

1. Add columns (`version`, `status`, `enshrined_at`, `title`, `notes`).
2. Backfill: existing rows → `version='red'`, `status='active'`.
3. `SET NOT NULL` on `version`/`status`, drop old unique, add partial unique.

App-level invariants (not DB-checkable without extra triggers):

- Active team: 0–6 mons. Enshrine requires 1–6.
- Enshrined rows immutable: server rejects add/remove targeting them.

## 4. API (`server/api/`)

All handlers keep existing auth semantics (`requireSession` in `server/utils/auth.ts` → 401 unauthenticated, 503 DB down via `rethrowHttpOrUnavailable`).

### Active roster (version-scoped, `status='active'` only)

- `GET /api/teams?version=<slug>` — `getOrCreate(userId, version, active)`. Missing/invalid `version` → 400. Replaces current userId-only lookup (`server/api/teams/index.get.ts:14-18`) and `onConflictDoNothing({ target: team.userId })` → conflict target becomes `(userId, version)` active pair.
- `POST /api/teams { version, pokemon }` — same 6-max + duplicate-name checks per active team (`server/api/teams/index.post.ts:60-72`), scoped to `(userId, version, active)`.
- `DELETE /api/teams/:name?version=<slug>` — remove from active team only (`server/api/teams/[name].delete.ts`).

### Hall of Fame

- `POST /api/teams/enshrine { version, title?, notes? }`
  - 400: missing/invalid version, active team empty (0 mons).
  - Transaction: flip `active` → `enshrined` (`status`, `enshrined_at=now()`, `title`, `notes`), insert fresh empty `active` for same `(userId, version)`.
  - Returns `{ success, title, enshrinedId }`.
- `GET /api/hall-of-fame?version=<slug | all>` — enshrined teams with nested pokemon (`name`, `types`, `sprites`, `damageRelations`), ordered by `enshrined_at DESC`.
- `DELETE /api/hall-of-fame/:id` — deletes owned enshrined team (cascade `team_pokemon`); 404 if not owned or not enshrined. Active team untouched.

## 5. Client (`app/`)

- New `useVersions()` composable: fetches `version?limit=100`, caches names, exposes `versions`, `selectedVersion` via `useState("selected-version")` (per issue: `useState`, not localStorage; default `'red'`).
- `useTeam(version)` (`app/composables/useTeam.ts:35-36`): key state `useState('team-' + version)`, append `?version=` on refresh/add, `{ version }` body on POST, `?version=` on DELETE.
- `Header.vue`: version `<select>` when signed in; switching triggers `refresh()`.
- `pages/team.vue`: `Enshrine this team` button + confirm; disabled when empty; on success show message + navigate to `/hall-of-fame`.
- New `pages/hall-of-fame.vue`: version filter (reuse `selectedVersion` + `All` option), read-only `PokemonCollapse`-style list with `enshrined_at` + `title`/`notes`, delete-memorial button with confirm.
- `Spec.md` §4–5 team flow must be updated post-implementation (active vs. enshrined, new routes).

## 6. Acceptance

- [ ] Fresh user selects `scarlet` → empty active team; adds ≤6; switching to `red` shows separate empty team.
- [ ] Existing pre-feature team appears under `red` as `active`.
- [ ] Enshrine with 0 mons → 400 + user message; with 1–6 → memorial appears in HOF, active resets to empty.
- [ ] Multiple enshrines per version accumulate, newest first.
- [ ] Enshrined memorial has no add/remove controls; deleting memorial leaves active intact.
- [ ] Missing/invalid `version` on any teams endpoint → 400 (not 500).
- [ ] `pnpm typecheck`, `pnpm lint` pass; `drizzle-kit migrate` upgrades clean DB and backfills existing rows to `red`.

## 7. Manual test plan (no test framework configured per `Spec.md:28`)

- `pnpm db:migrate` on seed DB with legacy row → assert `version='red'`, `status='active'`.
- `curl` active CRUD with `?version=scarlet` (401 logged out, 200 logged in via session cookie).
- `curl POST /api/teams/enshrine` empty → 400; with 2 mons → 200, second `GET /api/teams?version=scarlet` empty.
- `curl GET /api/hall-of-fame?version=all` → 1 memorial; `DELETE` → gone.
- UI: sign in → switch Header version → add → enshrine → verify `/hall-of-fame` entry + active reset.

## 8. Out of scope

- Per-Pokémon nicknames, battle stats, HOF sharing/public pages.
- `localStorage` persistence of version (explicitly `useState` per issue).
- Version-specific legality checks (any Pokémon allowed on any version team).
