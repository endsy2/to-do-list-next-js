"use client";

import { TodoFilters } from "./TodoFilters";
import { TodoInput } from "./TodoInput";
import { TodoList } from "./TodoList";
import { useTodos } from "@/features/todos/hooks/useTodos";
import type { Todo } from "@/features/todos/types";

const NO_RESULT_MESSAGE = "No result. Create a new one instead!";

const EMPTY_MESSAGES = {
  all: "Nothing here yet — add your first todo above.",
  active: "No active todos. Nice work.",
  completed: "No completed todos yet.",
} as const;

type TodoAppProps = {
  initialTodos: Todo[];
};

export function TodoApp({ initialTodos }: TodoAppProps) {
  const {
    todos,
    counts,
    error,
    filter,
    pendingIds,
    input,
    editingId,
    isFiltered,
    setFilter,
    setInput,
    submit,
    startEditing,
    cancelEditing,
    toggleTodo,
    removeTodo,
    dismissError,
    retry,
  } = useTodos(initialTodos);

  return (
    <section className="w-full max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Todo List</h1>
        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          Type to filter. Press Enter to add. Hover a todo for its actions.
        </p>
      </header>

      <TodoInput
        value={input}
        isEditing={editingId !== null}
        onChange={setInput}
        onSubmit={submit}
        onCancel={cancelEditing}
      />

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          <span>{error}</span>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={retry}
              className="font-medium underline underline-offset-2"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={dismissError}
              aria-label="Dismiss error"
              className="opacity-60 transition hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {counts.total > 0 && (
          <div className="mb-2 border-b border-black/10 pb-3 dark:border-white/10">
            <TodoFilters filter={filter} counts={counts} onChange={setFilter} />
          </div>
        )}

        <TodoList
          todos={todos}
          pendingIds={pendingIds}
          editingId={editingId}
          emptyMessage={
            isFiltered ? NO_RESULT_MESSAGE : EMPTY_MESSAGES[filter]
          }
          onToggle={toggleTodo}
          onEdit={startEditing}
          onRemove={removeTodo}
        />
      </div>
    </section>
  );
}
