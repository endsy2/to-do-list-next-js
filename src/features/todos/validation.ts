import { ValidationError } from "@/shared/errors";
import {
  TODO_MAX_LENGTH,
  TODO_SEARCH_MAX_LENGTH,
  type CreateTodoInput,
  type TodoQuery,
  type UpdateTodoInput,
} from "@/features/todos/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseText(value: unknown, issues: string[]): string | undefined {
  if (typeof value !== "string") {
    issues.push("`todo` must be a string");
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    issues.push("`todo` must not be empty");
    return undefined;
  }

  if (trimmed.length > TODO_MAX_LENGTH) {
    issues.push(`\`todo\` must be at most ${TODO_MAX_LENGTH} characters`);
    return undefined;
  }

  return trimmed;
}

export function parseTodoQuery(params: URLSearchParams): TodoQuery {
  const raw = params.get("q");
  if (raw === null) return {};

  const search = raw.trim();
  if (search.length === 0) return {};

  if (search.length > TODO_SEARCH_MAX_LENGTH) {
    throw new ValidationError([
      `\`q\` must be at most ${TODO_SEARCH_MAX_LENGTH} characters`,
    ]);
  }

  return { search };
}

export function parseCreateTodoInput(payload: unknown): CreateTodoInput {
  if (!isRecord(payload)) {
    throw new ValidationError(["Request body must be a JSON object"]);
  }

  const issues: string[] = [];
  const todo = parseText(payload.todo, issues);

  if (issues.length > 0 || todo === undefined) {
    throw new ValidationError(issues);
  }

  return { todo };
}

export function parseUpdateTodoInput(payload: unknown): UpdateTodoInput {
  if (!isRecord(payload)) {
    throw new ValidationError(["Request body must be a JSON object"]);
  }

  const issues: string[] = [];
  const input: UpdateTodoInput = {};

  if (payload.todo !== undefined) {
    const todo = parseText(payload.todo, issues);
    if (todo !== undefined) {
      input.todo = todo;
    }
  }

  if (payload.isCompleted !== undefined) {
    if (typeof payload.isCompleted !== "boolean") {
      issues.push("`isCompleted` must be a boolean");
    } else {
      input.isCompleted = payload.isCompleted;
    }
  }

  if (issues.length > 0) {
    throw new ValidationError(issues);
  }

  if (Object.keys(input).length === 0) {
    throw new ValidationError([
      "Provide at least one of `todo` or `isCompleted`",
    ]);
  }

  return input;
}
