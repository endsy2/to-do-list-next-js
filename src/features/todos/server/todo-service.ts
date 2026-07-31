import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "@/shared/errors";
import { DUPLICATE_TODO_MESSAGE } from "@/features/todos/duplicates";
import { getTodoRepository, type TodoRepository } from "@/features/todos/server/repositories";
import type {
  CreateTodoInput,
  Todo,
  TodoQuery,
  UpdateTodoInput,
} from "@/features/todos/types";

export class TodoService {
  constructor(private readonly repository: TodoRepository) {}

  list(query: TodoQuery = {}): Promise<Todo[]> {
    return this.repository.findAll({ search: query.search });
  }

  async get(id: string): Promise<Todo> {
    const todo = await this.repository.findById(id);
    if (!todo) throw new NotFoundError("Todo", id);
    return todo;
  }

  async create(input: CreateTodoInput): Promise<Todo> {
    await this.assertNoDuplicate(input.todo);

    const todo: Todo = {
      id: randomUUID(),
      todo: input.todo,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    return this.repository.create(todo);
  }

  async update(id: string, input: UpdateTodoInput): Promise<Todo> {
    if (input.todo !== undefined) {
      await this.assertNoDuplicate(input.todo, id);
    }

    const updated = await this.repository.update(id, input);
    if (!updated) throw new NotFoundError("Todo", id);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError("Todo", id);
  }

  /**
   * Rejects text that another todo already uses. `excludeId` is the todo being
   * renamed, which must not clash with itself.
   */
  private async assertNoDuplicate(text: string, excludeId?: string): Promise<void> {
    const existing = await this.repository.findByText(text);
    if (existing && existing.id !== excludeId) {
      throw new ConflictError(DUPLICATE_TODO_MESSAGE);
    }
  }
}

export function getTodoService(): TodoService {
  return new TodoService(getTodoRepository());
}
