"use client";

import { memo } from "react";
import { RelativeTime } from "@/shared/components/RelativeTime";
import type { Todo } from "@/features/todos/types";

type TodoItemProps = {
  todo: Todo;
  isPending: boolean;
  isEditing: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

// Revealed on hover, and on keyboard focus so the row stays operable without a
// mouse.
const ACTION_VISIBILITY =
  "opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100";

function TodoItemComponent({
  todo,
  isPending,
  isEditing,
  onToggle,
  onEdit,
  onRemove,
}: TodoItemProps) {
  return (
    <li
      className={`group flex items-center gap-3 border-b border-black/10 px-1 py-3 last:border-b-0 dark:border-white/10 ${
        isPending ? "opacity-60" : ""
      } ${isEditing ? "bg-amber-500/10" : ""}`}
    >
      <span
        className={`min-w-0 flex-1 break-words ${
          todo.isCompleted ? "text-black/40 line-through dark:text-white/40" : ""
        }`}
      >
        {todo.todo}
      </span>

      <RelativeTime
        isoDate={todo.createdAt}
        className="shrink-0 text-xs tabular-nums text-black/40 dark:text-white/40"
      />

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onToggle(todo.id)}
          disabled={isPending}
          className={`${ACTION_VISIBILITY} rounded px-2 py-1 text-xs text-black/60 hover:bg-black/5 hover:text-black disabled:opacity-40 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white`}
        >
          {todo.isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
        </button>

        <button
          type="button"
          onClick={() => onEdit(todo.id)}
          disabled={isPending}
          className={`${ACTION_VISIBILITY} rounded px-2 py-1 text-xs text-black/60 hover:bg-black/5 hover:text-black disabled:opacity-40 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white`}
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onRemove(todo.id)}
          disabled={isPending}
          className={`${ACTION_VISIBILITY} rounded px-2 py-1 text-xs text-red-600/80 hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40 dark:text-red-400/80 dark:hover:text-red-400`}
        >
          Remove
        </button>
      </div>
    </li>
  );
}

export const TodoItem = memo(TodoItemComponent);
