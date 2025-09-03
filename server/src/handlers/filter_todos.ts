import { db } from '../db';
import { todosTable } from '../db/schema';
import { type FilterTodosInput, type Todo } from '../schema';
import { eq, and, desc, type SQL } from 'drizzle-orm';

export const filterTodos = async (input: FilterTodosInput): Promise<Todo[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by completion status if provided
    if (input.completed !== undefined) {
      conditions.push(eq(todosTable.completed, input.completed));
    }

    // Filter by priority if provided
    if (input.priority !== undefined) {
      conditions.push(eq(todosTable.priority, input.priority));
    }

    // Build and execute query based on whether we have filters
    const results = conditions.length > 0
      ? await db.select()
          .from(todosTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(todosTable.created_at))
          .execute()
      : await db.select()
          .from(todosTable)
          .orderBy(desc(todosTable.created_at))
          .execute();

    // Return results with proper date conversion
    return results.map(todo => ({
      ...todo,
      // Ensure dates are properly converted to Date objects
      created_at: new Date(todo.created_at),
      updated_at: new Date(todo.updated_at),
      due_date: todo.due_date ? new Date(todo.due_date) : null
    }));
  } catch (error) {
    console.error('Todo filtering failed:', error);
    throw error;
  }
};