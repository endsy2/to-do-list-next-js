"use client";

import { useCallback, type KeyboardEvent, type SubmitEvent } from "react";
import { TODO_MAX_LENGTH } from "@/features/todos/types";

type TodoInputProps = {
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function TodoInput({
  value,
  isEditing,
  onChange,
  onSubmit,
  onCancel,
}: TodoInputProps) {
  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSubmit();
    },
    [onSubmit],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape" && (isEditing || value.length > 0)) {
        event.preventDefault();
        onCancel();
      }
    },
    [isEditing, onCancel, value.length],
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor="todo-input" className="sr-only">
        {isEditing ? "Edit todo" : "Add or filter todos"}
      </label>
      <input
        id="todo-input"
        name="todo"
        type="text"
        value={value}
        autoComplete="off"
        maxLength={TODO_MAX_LENGTH}
        placeholder={
          isEditing ? "Edit the todo, then press Enter" : "What needs to be done?"
        }
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className={`flex-1 rounded-lg border bg-white px-4 py-2.5 text-base outline-none transition placeholder:text-black/40 focus:ring-2 focus:ring-black/10 dark:bg-white/5 dark:placeholder:text-white/35 dark:focus:ring-white/10 ${
          isEditing
            ? "border-amber-500/70 focus:border-amber-500"
            : "border-black/15 focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
        }`}
      />
      <button
        type="submit"
        disabled={value.trim().length === 0}
        className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isEditing ? "Save" : "Add"}
      </button>
      {isEditing && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
