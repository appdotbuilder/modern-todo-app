import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createTodoInputSchema,
  updateTodoInputSchema,
  filterTodosInputSchema,
  deleteTodoInputSchema
} from './schema';

// Import handlers
import { createTodo } from './handlers/create_todo';
import { getTodos } from './handlers/get_todos';
import { getTodoById } from './handlers/get_todo_by_id';
import { updateTodo } from './handlers/update_todo';
import { deleteTodo } from './handlers/delete_todo';
import { filterTodos } from './handlers/filter_todos';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new todo item
  createTodo: publicProcedure
    .input(createTodoInputSchema)
    .mutation(({ input }) => createTodo(input)),

  // Get all todo items
  getTodos: publicProcedure
    .query(() => getTodos()),

  // Get a specific todo by ID
  getTodoById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getTodoById(input.id)),

  // Update an existing todo item
  updateTodo: publicProcedure
    .input(updateTodoInputSchema)
    .mutation(({ input }) => updateTodo(input)),

  // Delete a todo item
  deleteTodo: publicProcedure
    .input(deleteTodoInputSchema)
    .mutation(({ input }) => deleteTodo(input)),

  // Filter todos by completion status and/or priority
  filterTodos: publicProcedure
    .input(filterTodosInputSchema)
    .query(({ input }) => filterTodos(input))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Todo API server listening at port: ${port}`);
}

start();