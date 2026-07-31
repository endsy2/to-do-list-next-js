create table if not exists public.todos (
  id           uuid        primary key default gen_random_uuid(),
  todo         text        not null,
  is_completed boolean     not null default false,
  created_at   timestamptz not null default now(),

  constraint todo_length check (char_length(todo) between 1 and 500)
);

create index if not exists todos_created_at_idx
  on public.todos (created_at desc, id desc);

alter table public.todos enable row level security;
