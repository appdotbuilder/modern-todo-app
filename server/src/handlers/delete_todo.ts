import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTodo = async (input: DeleteTodoInput): Promise<{ success: boolean; message: string }> => {
  try {
    // Delete the todo item by ID
    const result = await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Check if any row was actually deleted
    if (result.length === 0) {
      return {
        success: false,
        message: `Todo with ID ${input.id} not found`
      };
    }

    return {
      success: true,
      message: `Todo with ID ${input.id} deleted successfully`
    };
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
};