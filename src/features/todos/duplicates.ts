import type { Todo } from "@/features/todos/types";

export const DUPLICATE_TODO_MESSAGE = "Todo already exists";

/**
 * Two todos count as the same when their text matches ignoring case and
 * surrounding whitespace. The unique index in migration `0002` normalises the
 * same way, so the database and the app agree on what "duplicate" means.
 */
export function normalizeTodoText(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Finds an existing todo with the same text. `excludeId` skips the todo being
 * renamed, so saving a rename that only changes capitalisation is not treated
 * as a clash with itself.
 */
export function findDuplicate(
  todos: readonly Todo[],
  text: string,
  excludeId?: string,
): Todo | undefined {
  const normalized = normalizeTodoText(text);

  return todos.find(
    (item) =>
      item.id !== excludeId && normalizeTodoText(item.todo) === normalized,
  );
}
