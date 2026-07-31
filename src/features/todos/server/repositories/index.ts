import { getSupabaseClient, isSupabaseConfigured } from "@/server/supabase/client";
import { InMemoryTodoRepository } from "./in-memory";
import { SupabaseTodoRepository } from "./supabase";
import type { TodoRepository } from "./todo-repository";

const globalForRepositories = globalThis as typeof globalThis & {
  __todoRepository?: TodoRepository;
};

function createTodoRepository(): TodoRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseTodoRepository(getSupabaseClient());
  }

  console.warn(
    "[todos] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — using the in-memory store. See .env.example.",
  );
  return new InMemoryTodoRepository();
}

export function getTodoRepository(): TodoRepository {
  globalForRepositories.__todoRepository ??= createTodoRepository();
  return globalForRepositories.__todoRepository;
}

export type { TodoRepository, TodoPatch, TodoFilters } from "./todo-repository";
