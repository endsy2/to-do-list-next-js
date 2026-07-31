import { NextResponse } from "next/server";
import { readJson, toErrorResponse } from "@/server/http";
import { getTodoService } from "@/features/todos/server/todo-service";
import { parseUpdateTodoInput } from "@/features/todos/validation";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const todo = await getTodoService().get(id);
    return NextResponse.json(todo);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const input = parseUpdateTodoInput(await readJson(request));
    const todo = await getTodoService().update(id, input);
    return NextResponse.json(todo);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await getTodoService().remove(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
