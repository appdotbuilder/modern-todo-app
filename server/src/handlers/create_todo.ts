import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type Todo } from '../schema';

export const createTodo = async (input: CreateTodoInput): Promise<Todo> => {
  try {
    // Insert todo record
    const result = await db.insert(todosTable)
      .values({
        title: input.title,
        description: input.description || null,
        due_date: input.due_date ? input.due_date.toISOString().split('T')[0] : null, // Convert Date to YYYY-MM-DD string format
        priority: input.priority || null,
        // completed defaults to false in schema, no need to set explicitly
        // created_at and updated_at default to NOW() in schema
      })
      .returning()
      .execute();

    // Return the created todo item
    const todo = result[0];
    return {
      ...todo,
      // Ensure date fields are properly typed as Date objects
      created_at: new Date(todo.created_at),
      updated_at: new Date(todo.updated_at),
      due_date: todo.due_date ? new Date(todo.due_date) : null
    };
  } catch (error) {
    console.error('Todo creation failed:', error);
    throw error;
  }
};