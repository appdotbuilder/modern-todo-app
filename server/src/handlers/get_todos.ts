import { db } from '../db';
import { todosTable } from '../db/schema';
import { type Todo } from '../schema';
import { desc } from 'drizzle-orm';

export const getTodos = async (): Promise<Todo[]> => {
  try {
    // Fetch all todos ordered by creation date (newest first)
    const results = await db.select()
      .from(todosTable)
      .orderBy(desc(todosTable.created_at))
      .execute();

    // Return results with proper date coercion
    return results.map(todo => ({
      ...todo,
      created_at: new Date(todo.created_at),
      updated_at: new Date(todo.updated_at),
      due_date: todo.due_date ? new Date(todo.due_date) : null
    }));
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    throw error;
  }
};