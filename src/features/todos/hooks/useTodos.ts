"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiRequestError, todosApi } from "@/features/todos/todos-client";
import {
  DUPLICATE_TODO_MESSAGE,
  findDuplicate,
  normalizeTodoText,
} from "@/features/todos/duplicates";
import type { Todo } from "@/features/todos/types";

export type TodoFilter = "all" | "active" | "completed";

export type TodoCounts = {
  total: number;
  active: number;
  completed: number;
};

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return error.displayMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function placeholderId(): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `placeholder:${id}`;
}

export function useTodos(initialTodos: Todo[]) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // One input bar drives three things: adding, filtering, and editing.
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const todosRef = useRef<Todo[]>(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  const inFlightRef = useRef(0);

  const markPending = useCallback((id: string, isPending: boolean) => {
    inFlightRef.current += isPending ? 1 : -1;
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (inFlightRef.current > 0) return;

    try {
      const data = await todosApi.list(undefined, signal);
      if (signal?.aborted || inFlightRef.current > 0) return;
      setTodos(data);
      setError(null);
    } catch (err) {
      if (signal?.aborted || isAbort(err)) return;
      setError(toMessage(err, "Could not refresh todos"));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const handleFocus = () => void refresh(controller.signal);

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      controller.abort();
    };
  }, [refresh]);

  const addTodo = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (trimmed.length === 0) return false;

      // `todos` holds the whole list — filtering happens on the way to the
      // screen — so this catches duplicates without a round trip. The server
      // still checks, since another tab may have added the same text.
      if (findDuplicate(todosRef.current, trimmed)) {
        setError(DUPLICATE_TODO_MESSAGE);
        return false;
      }

      const tempId = placeholderId();
      const placeholder: Todo = {
        id: tempId,
        todo: trimmed,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };

      setTodos((prev) => [placeholder, ...prev]);
      markPending(tempId, true);
      setError(null);

      try {
        const created = await todosApi.create({ todo: trimmed });
        setTodos((prev) =>
          prev.map((item) => (item.id === tempId ? created : item)),
        );
        return true;
      } catch (err) {
        setTodos((prev) => prev.filter((item) => item.id !== tempId));
        setError(toMessage(err, "Could not add todo"));
        return false;
      } finally {
        markPending(tempId, false);
      }
    },
    [markPending],
  );

  const toggleTodo = useCallback(
    async (id: string) => {
      const target = todosRef.current.find((item) => item.id === id);
      if (!target) return;

      const isCompleted = !target.isCompleted;
      setTodos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isCompleted } : item)),
      );
      markPending(id, true);
      setError(null);

      try {
        const updated = await todosApi.update(id, { isCompleted });
        setTodos((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
      } catch (err) {
        setTodos((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, isCompleted: target.isCompleted }
              : item,
          ),
        );
        setError(toMessage(err, "Could not update todo"));
      } finally {
        markPending(id, false);
      }
    },
    [markPending],
  );

  const editTodo = useCallback(
    async (id: string, text: string): Promise<boolean> => {
      const trimmed = text.trim();
      const target = todosRef.current.find((item) => item.id === id);
      if (!target || trimmed.length === 0) return false;
      if (trimmed === target.todo) return true;

      if (findDuplicate(todosRef.current, trimmed, id)) {
        setError(DUPLICATE_TODO_MESSAGE);
        return false;
      }

      setTodos((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, todo: trimmed } : item,
        ),
      );
      markPending(id, true);
      setError(null);

      try {
        const updated = await todosApi.update(id, { todo: trimmed });
        setTodos((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
        return true;
      } catch (err) {
        setTodos((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, todo: target.todo } : item,
          ),
        );
        setError(toMessage(err, "Could not rename todo"));
        return false;
      } finally {
        markPending(id, false);
      }
    },
    [markPending],
  );

  const removeTodo = useCallback(
    async (id: string) => {
      const index = todosRef.current.findIndex((item) => item.id === id);
      if (index === -1) return;
      const removed = todosRef.current[index];

      // Deleting the todo being edited leaves nothing to save.
      setEditingId((current) => {
        if (current !== id) return current;
        setInput("");
        return null;
      });

      setTodos((prev) => prev.filter((item) => item.id !== id));
      markPending(id, true);
      setError(null);

      try {
        await todosApi.remove(id);
      } catch (err) {
        setTodos((prev) => {
          const next = [...prev];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        });
        setError(toMessage(err, "Could not delete todo"));
      } finally {
        markPending(id, false);
      }
    },
    [markPending],
  );

  const startEditing = useCallback((id: string) => {
    const target = todosRef.current.find((item) => item.id === id);
    if (!target) return;

    setEditingId(id);
    setInput(target.todo);
    setError(null);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setInput("");
    setError(null);
  }, []);

  /** Enter in the input bar: saves the edit in progress, or adds a new todo. */
  const submit = useCallback(async () => {
    const text = input.trim();
    if (text.length === 0) return;

    if (editingId !== null) {
      const saved = await editTodo(editingId, text);
      if (saved) {
        setEditingId(null);
        setInput("");
      }
      return;
    }

    const added = await addTodo(text);
    if (added) setInput("");
  }, [addTodo, editTodo, editingId, input]);

  const counts = useMemo<TodoCounts>(() => {
    const completed = todos.reduce(
      (total, item) => total + (item.isCompleted ? 1 : 0),
      0,
    );
    return {
      total: todos.length,
      completed,
      active: todos.length - completed,
    };
  }, [todos]);

  // While editing, the input holds the todo's own text — filtering by it would
  // hide everything else for no reason.
  const searchTerm = editingId === null ? normalizeTodoText(input) : "";
  const isFiltered = searchTerm.length > 0;

  const visibleTodos = useMemo(() => {
    const byStatus =
      filter === "active"
        ? todos.filter((item) => !item.isCompleted)
        : filter === "completed"
          ? todos.filter((item) => item.isCompleted)
          : todos;

    if (searchTerm.length === 0) return byStatus;

    return byStatus.filter((item) =>
      normalizeTodoText(item.todo).includes(searchTerm),
    );
  }, [todos, filter, searchTerm]);

  const dismissError = useCallback(() => setError(null), []);
  const retry = useCallback(() => void refresh(), [refresh]);

  return {
    todos: visibleTodos,
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
  };
}
