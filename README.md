# Todo List

A small, production-shaped todo application built with the Next.js App Router,
TypeScript, and React hooks. Todos are persisted in Supabase (Postgres) behind a
repository interface, so the storage choice stays isolated to a single file.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

That runs against an in-memory store, which is enough to click around. To
persist to Supabase:

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/0001_create_todos.sql` in the dashboard's
   **SQL Editor** (or `supabase db push` with the CLI).
3. Copy `.env.example` to `.env.local` and fill in both values from
   **Project Settings → API**:

   ```bash
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   ```

4. Restart the dev server.

With both variables set the app uses Supabase; with either missing it falls back
to the in-memory store and logs a warning at startup.

Other scripts:

```bash
npm run build    # production build (also type-checks)
npm start        # serve the production build
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
npx tsc --noEmit # type-check on its own
```

> Without Supabase credentials the store is in memory, so todos reset whenever
> the server process restarts.

## Features

- Type a todo and press **Enter** (or click **Add**) to create it
- Toggle completion, rename (double-click or **Edit**), and delete
- Filter by **All / Active / Completed**, with live counts
- Optimistic updates with per-todo rollback when a request fails
- Inline error banner with retry
- Server-rendered first paint — no loading flash
- Keyboard and screen-reader friendly: real form semantics, labels, `aria-pressed`

## Architecture

The dependency direction is one-way: UI → API client → route handler → service →
repository. Nothing on an inner layer knows about an outer one.

```
src/
├── app/
│   ├── page.tsx                 Server component; seeds the initial list
│   ├── layout.tsx
│   └── api/todos/
│       ├── route.ts             GET (list), POST (create)
│       └── [id]/route.ts        GET, PATCH, DELETE
├── features/todos/              Everything the todos feature owns
│   ├── index.ts                 Public barrel — client-safe exports only
│   ├── components/
│   │   ├── TodoApp.tsx          Container: wires the hook to the UI
│   │   ├── TodoInput.tsx        Composer (<form>, so Enter submits natively)
│   │   ├── TodoList.tsx         List + empty states
│   │   ├── TodoItem.tsx         One row; memoised, handles inline editing
│   │   └── TodoFilters.tsx      Filter buttons and counts
│   ├── hooks/useTodos.ts        All todo state and API calls
│   ├── todos-client.ts          Typed browser-side client for /api/todos
│   ├── validation.ts            Request-payload parsing
│   ├── types.ts                 Domain model and DTOs
│   └── server/                  Never reached from a client component
│       ├── todo-service.ts      Business logic (IDs, timestamps, existence)
│       └── repositories/
│           ├── todo-repository.ts  The persistence contract
│           ├── supabase.ts       Supabase/Postgres implementation
│           ├── in-memory.ts      Fallback when unconfigured
│           └── index.ts          Picks one — the single composition point
├── server/                      Server-only infrastructure
│   ├── http.ts                  Error → HTTP response mapping
│   └── supabase/                Client + schema types (imports `server-only`)
└── shared/                      Cross-feature, no todo knowledge
    ├── components/RelativeTime.tsx  Hydration-safe timestamp
    ├── hooks/useHydrated.ts     useSyncExternalStore hydration gate
    ├── errors.ts                Domain errors carrying HTTP status
    └── format.ts                Date formatting helpers

supabase/migrations/             SQL schema
```

### Where does a new file go?

- Does it mention todos? → `features/todos/`. Would it touch a database or a
  secret? → `features/todos/server/`.
- Is it infrastructure with no feature knowledge, but server-bound? →
  `server/`.
- Would a second, unrelated feature use it verbatim? → `shared/`.
- Anything else belongs in `app/`, which holds routing and nothing else.

The rule that matters: **`shared/` and `server/` never import from
`features/`.** Dependencies point one way, so a feature can be deleted by
deleting its folder.

### Layers

**Repository** (`features/todos/server/repositories`) — the persistence contract, with two
implementations behind it: `SupabaseTodoRepository` and an in-memory fallback.
Nothing above this layer knows which is in use, or that Supabase exists at all.
`supabase-js` is imported in exactly one file.

**Service** (`features/todos/server/todo-service.ts`) — business rules that hold regardless of caller or
storage: UUID generation, `createdAt`, and "does this todo exist?" (raising
`NotFoundError`). The repository is constructor-injected, so tests can pass a
fake without touching HTTP.

**Route handlers** (`app/api`) — thin transport adapters. Parse and validate the
body, call the service, map the result to a response. All error-to-status
translation is centralised in `server/http.ts`, so unexpected failures surface as a
generic 500 and never leak internal details.

**Client** (`features/todos/hooks`, `features/todos/components`) — `useTodos`
owns all state and every network call; components below it are free of side
effects.

### Persistence and security

`getTodoRepository()` in `src/features/todos/server/repositories/index.ts` is the single
composition point: it returns the Supabase repository when credentials are
present and the in-memory one otherwise. Adding a third backing store means
implementing `TodoRepository` and returning it here — services, route handlers,
and the UI are untouched.

The security model is worth being explicit about:

- **The browser never talks to Supabase.** It calls `/api/todos`; the route
  handlers talk to Postgres. So `supabase-js` never enters the client bundle.
- **The service role key stays on the server.** Neither variable is prefixed
  `NEXT_PUBLIC_`, and `src/server/supabase/client.ts` imports `server-only`, which
  turns "someone imported this into a client component" into a build error
  rather than a leaked key.
- **RLS is enabled with no policies.** The service role bypasses RLS, so the app
  works; the public anon key matches no policy and can therefore read and write
  nothing. If you later expose the table to the browser or add per-user todos,
  that's the point to write explicit policies.
- **Validation still runs in the app**, and the `todo_length` check constraint
  mirrors it in the database, so the rule holds even for writes from elsewhere.

Postgres stores `snake_case`; the domain model is `camelCase`. That mapping
lives in `toDomain()` in the repository and goes no further.

## API

Errors respond with `{ "error": string, "issues"?: string[] }`.

| Method   | Path             | Body                                    | Success        |
| -------- | ---------------- | --------------------------------------- | -------------- |
| `GET`    | `/api/todos?q=`  | –                                       | `200` `Todo[]` |
| `POST`   | `/api/todos`     | `{ todo: string }`                      | `201` `Todo`   |
| `GET`    | `/api/todos/:id` | –                                       | `200` `Todo`   |
| `PATCH`  | `/api/todos/:id` | `{ todo?: string, isCompleted?: bool }` | `200` `Todo`   |
| `DELETE` | `/api/todos/:id` | –                                       | `204`          |

```ts
type Todo = {
  id: string; // UUID v4
  todo: string; // trimmed, 1–500 characters
  isCompleted: boolean;
  createdAt: string; // ISO 8601
};
```

Text is trimmed and validated on the server; an update requires at least one
field. Unknown ids return `404`. Todos are returned newest first.

### Duplicates

Two todos are the same when their text matches ignoring case and surrounding
whitespace, so `Buy milk`, `buy milk`, and `  BUY MILK  ` are one todo. Adding
or renaming onto text that already exists responds `409`
`{ "error": "Todo already exists" }`; renaming a todo to a different casing of
its own text is allowed, since it does not clash with anything but itself.

The rule is enforced three times over, each layer covering what the one above
it cannot:

- **The UI** checks the loaded list first, so the warning appears without a
  round trip and no placeholder row flashes in and out.
- **The service** re-checks against the repository, which is what makes the
  rule hold for any client of the API, not just this one.
- **A unique index** on `lower(btrim(todo))` (migration `0002`) settles the
  race two simultaneous inserts would otherwise win together. Postgres raises
  `23505`, the repository translates it into the same `409`, so a losing insert
  reads as a duplicate rather than a `500`.

Applying `0002` to a table that already contains duplicates fails; the
migration comment includes the query to find the offending rows.

### Search

`GET /api/todos?q=milk` returns only todos whose text contains the term,
case-insensitively. The filter is pushed down to the repository — Postgres
`ILIKE` for Supabase, `Array.filter` for the in-memory store — so unmatched rows
are never loaded, let alone sent.

- `q` is trimmed; blank or absent both mean "no filter", so `?q=` behaves like
  no `q` at all.
- Terms longer than 500 characters return `400`.
- `%` and `_` are escaped before reaching `ILIKE`, so they match literally
  rather than acting as wildcards.

The UI debounces keystrokes by 300 ms and aborts the previous request on each
new one, so responses cannot arrive out of order and leave a stale list.

## Notes on some decisions

**IDs** — `randomUUID()` from `node:crypto` produces RFC 4122 v4 UUIDs, so the
`uuid` package would be a dependency for no gain. IDs are assigned server-side in
the service layer, which keeps that rule true regardless of backing store; the
column also has a `gen_random_uuid()` default as a safety net.

**Malformed ids return 404, not 500.** Postgres rejects a non-uuid string with
error `22P02` instead of returning no rows, so the repository shape-checks ids
first. `/api/todos/not-a-uuid` behaves exactly like a missing todo, and never
reaches the database.

**Timestamps are normalised.** Postgres returns `+00:00` offsets while the
in-memory store produces `Z`. The repository normalises to ISO `Z` so both
backends are indistinguishable to the client.

**Reads bypass HTTP on the server** — `page.tsx` calls the service directly
rather than fetching its own route handler, which would only add a round trip.
Both entry points share the same service and repository, and every client
mutation goes through `/api/todos`.

**Optimistic updates roll back per todo, not per list.** Restoring a whole-list
snapshot on failure would discard unrelated changes that landed while the failed
request was in flight, so each operation reverts only the todo it touched.

**`useEffect` is used for subscriptions, not fetch-on-mount.** The initial list
arrives from the server, and the one data effect subscribes to window `focus` to
re-sync, updating state from that callback. A background refresh is skipped
while any mutation is in flight so it cannot clobber optimistic state.

**Timestamps are hydration-safe.** Relative time and locale formatting depend on
the viewer's clock and locale, which the server cannot know. `RelativeTime`
renders them only after hydration via `useSyncExternalStore`, whose dedicated
server snapshot avoids both a mismatch and a `setState` inside an effect.

**Fonts** — the scaffold's `next/font/google` import was replaced with a system
font stack so builds need no network access.

## Possible next steps

- Unit-test the service against a fake repository, plus component tests
- Multi-user support: add `user_id`, Supabase Auth, and RLS policies scoping
  rows to `auth.uid()`
- Supabase Realtime to push changes between open tabs, replacing the
  refresh-on-focus behaviour
# to-do-list-next-js
