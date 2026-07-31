"use client";

import { TodoItem } from "./TodoItem";
import type { Todo } from "@/features/todos/types";

type TodoListProps = {
  todos: Todo[];
  pendingIds: ReadonlySet<string>;
  editingId: string | null;
  emptyMessage: string;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

export function TodoList({
  todos,
  pendingIds,
  editingId,
  emptyMessage,
  onToggle,
  onEdit,
  onRemove,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <p className="px-1 py-10 text-center text-sm text-black/50 dark:text-white/50">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="list-none">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isPending={pendingIds.has(todo.id)}
          isEditing={todo.id === editingId}
          onToggle={onToggle}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}
