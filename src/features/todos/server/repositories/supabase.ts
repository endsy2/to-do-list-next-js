import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import type { TodoDatabaseClient } from "@/server/supabase/client";
import type { TodoRow } from "@/server/supabase/database.types";
import { ConflictError } from "@/shared/errors";
import { DUPLICATE_TODO_MESSAGE } from "@/features/todos/duplicates";
import type { Todo } from "@/features/todos/types";
import type { TodoFilters, TodoPatch, TodoRepository } from "./todo-repository";

const TABLE = "todos";

/** Postgres `unique_violation` — raised by `todos_unique_text_idx`. */
const UNIQUE_VIOLATION = "23505";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&");
}

function toDomain(row: TodoRow): Todo {
  return {
    id: row.id,
    todo: row.todo,
    isCompleted: row.is_completed,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function fail(action: string, error: PostgrestError): never {
  // The unique index on the normalised text is the last line of defence: two
  // requests can both pass the pre-check and only one insert can win, so the
  // loser surfaces here rather than as a 500.
  if (error.code === UNIQUE_VIOLATION) {
    throw new ConflictError(DUPLICATE_TODO_MESSAGE);
  }

  throw new Error(
    `Supabase failed to ${action}: ${error.message} (code ${error.code})`,
  );
}

export class SupabaseTodoRepository implements TodoRepository {
  constructor(private readonly client: TodoDatabaseClient) {}

  async findAll(filters?: TodoFilters): Promise<Todo[]> {
    let query = this.client
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    const search = filters?.search?.trim();
    if (search) {
      query = query.ilike("todo", `%${escapeLikePattern(search)}%`);
    }

    const { data, error } = await query;

    if (error) fail("list todos", error);
    return (data ?? []).map(toDomain);
  }

  async findById(id: string): Promise<Todo | null> {
    if (!UUID_PATTERN.test(id)) return null;

    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) fail("load todo", error);
    return data ? toDomain(data) : null;
  }

  async findByText(text: string): Promise<Todo | null> {
    const trimmed = text.trim();
    if (trimmed.length === 0) return null;

    // `ILIKE` with every wildcard escaped is an exact, case-insensitive match.
    // `limit(1)` rather than `maybeSingle()` so rows that predate the unique
    // index cannot turn a duplicate check into an error.
    const { data, error } = await this.client
      .from(TABLE)
      .select("*")
      .ilike("todo", escapeLikePattern(trimmed))
      .limit(1);

    if (error) fail("look up todo by text", error);

    const [row] = data ?? [];
    return row ? toDomain(row) : null;
  }

  async create(todo: Todo): Promise<Todo> {
    const { data, error } = await this.client
      .from(TABLE)
      .insert({
        id: todo.id,
        todo: todo.todo,
        is_completed: todo.isCompleted,
        created_at: todo.createdAt,
      })
      .select("*")
      .single();

    if (error) fail("create todo", error);
    return toDomain(data);
  }

  async update(id: string, patch: TodoPatch): Promise<Todo | null> {
    if (!UUID_PATTERN.test(id)) return null;

    const columns: { todo?: string; is_completed?: boolean } = {};
    if (patch.todo !== undefined) columns.todo = patch.todo;
    if (patch.isCompleted !== undefined) columns.is_completed = patch.isCompleted;

    if (Object.keys(columns).length === 0) return this.findById(id);

    const { data, error } = await this.client
      .from(TABLE)
      .update(columns)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) fail("update todo", error);
    return data ? toDomain(data) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID_PATTERN.test(id)) return false;

    const { data, error } = await this.client
      .from(TABLE)
      .delete()
      .eq("id", id)
      .select("id");

    if (error) fail("delete todo", error);
    return (data ?? []).length > 0;
  }
}
