import { db } from '../db';
import { todosTable } from '../db/schema';
import { type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const getTodoById = async (id: number): Promise<Todo | null> => {
  try {
    const results = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const todo = results[0];
    return {
      ...todo,
      // Convert string dates to Date objects for consistency with schema
      created_at: new Date(todo.created_at),
      updated_at: new Date(todo.updated_at),
      // Handle nullable due_date field
      due_date: todo.due_date ? new Date(todo.due_date) : null
    };
  } catch (error) {
    console.error('Failed to fetch todo by ID:', error);
    throw error;
  }
};