import type { Todo } from "@/features/todos/types";

export type TodoPatch = Partial<Pick<Todo, "todo" | "isCompleted">>;

export type TodoFilters = {
  search?: string;
};

export interface TodoRepository {
  findAll(filters?: TodoFilters): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  /** Exact text match, ignoring case and surrounding whitespace. */
  findByText(text: string): Promise<Todo | null>;
  create(todo: Todo): Promise<Todo>;
  update(id: string, patch: TodoPatch): Promise<Todo | null>;
  delete(id: string): Promise<boolean>;
}
