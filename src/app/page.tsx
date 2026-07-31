import { TodoApp } from "@/features/todos";
import { getTodoService } from "@/features/todos/server/todo-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const todos = await getTodoService().list();

  return (
    <main className="flex flex-1 justify-center px-4 py-12 sm:py-20">
      <TodoApp initialTodos={todos} />
    </main>
  );
}
