import { NextResponse } from "next/server";
import { readJson, toErrorResponse } from "@/server/http";
import { getTodoService } from "@/features/todos/server/todo-service";
import {
  parseCreateTodoInput,
  parseTodoQuery,
} from "@/features/todos/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = parseTodoQuery(new URL(request.url).searchParams);
    const todos = await getTodoService().list(query);
    return NextResponse.json(todos);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = parseCreateTodoInput(await readJson(request));
    const todo = await getTodoService().create(input);
    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
