import type {
  ApiErrorBody,
  CreateTodoInput,
  Todo,
  UpdateTodoInput,
  TodoQuery,
} from "@/features/todos/types";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly issues: string[];

  constructor(message: string, status: number, issues: string[] = []) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.issues = issues;
  }

  get displayMessage(): string {
    return this.issues.length > 0 ? this.issues.join(", ") : this.message;
  }
}

const BASE_URL = "/api/todo";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers:
      init?.body === undefined
        ? init?.headers
        : { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiRequestError(
      body?.error ?? `Request failed with status ${response.status}`,
      response.status,
      body?.issues,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const todosApi = {
  list(query?: TodoQuery, signal?: AbortSignal): Promise<Todo[]> {
    const params = new URLSearchParams();
    const search = query?.search?.trim();
    if (search) params.set("q", search);

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    return request<Todo[]>(url, { signal, cache: "no-store" });
  },

  create(input: CreateTodoInput, signal?: AbortSignal): Promise<Todo> {
    return request<Todo>(BASE_URL, {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    });
  },

  update(
    id: string,
    input: UpdateTodoInput,
    signal?: AbortSignal,
  ): Promise<Todo> {
    return request<Todo>(`${BASE_URL}/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
      signal,
    });
  },

  remove(id: string, signal?: AbortSignal): Promise<void> {
    return request<void>(`${BASE_URL}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      signal,
    });
  },
};
