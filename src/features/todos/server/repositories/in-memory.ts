import { findDuplicate } from "@/features/todos/duplicates";
import type { Todo } from "@/features/todos/types";
import type { TodoFilters, TodoPatch, TodoRepository } from "./todo-repository";

export class InMemoryTodoRepository implements TodoRepository {
  private readonly todos = new Map<string, Todo>();

  async findAll(filters?: TodoFilters): Promise<Todo[]> {
    const search = filters?.search?.trim().toLowerCase();

    return [...this.todos.values()]
      .map((todo, index) => ({ todo, index }))
      .filter(
        ({ todo }) =>
          !search || todo.todo.toLowerCase().includes(search),
      )
      .sort(
        (a, b) =>
          b.todo.createdAt.localeCompare(a.todo.createdAt) ||
          b.index - a.index,
      )
      .map(({ todo }) => ({ ...todo }));
  }

  async findById(id: string): Promise<Todo | null> {
    const found = this.todos.get(id);
    return found ? { ...found } : null;
  }

  async findByText(text: string): Promise<Todo | null> {
    const found = findDuplicate([...this.todos.values()], text);
    return found ? { ...found } : null;
  }

  async create(todo: Todo): Promise<Todo> {
    this.todos.set(todo.id, { ...todo });
    return { ...todo };
  }

  async update(id: string, patch: TodoPatch): Promise<Todo | null> {
    const existing = this.todos.get(id);
    if (!existing) return null;

    const updated: Todo = { ...existing, ...patch };
    this.todos.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.todos.delete(id);
  }
}
