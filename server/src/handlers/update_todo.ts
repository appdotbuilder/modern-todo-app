import { db } from '../db';
import { todosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateTodoInput, type Todo } from '../schema';

export const updateTodo = async (input: UpdateTodoInput): Promise<Todo> => {
  try {
    // First, check if the todo exists
    const existingTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, input.id))
      .execute();

    if (existingTodo.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateFields: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.title !== undefined) {
      updateFields.title = input.title;
    }
    if (input.description !== undefined) {
      updateFields.description = input.description;
    }
    if (input.due_date !== undefined) {
      updateFields.due_date = input.due_date ? input.due_date.toISOString().split('T')[0] : null;
    }
    if (input.completed !== undefined) {
      updateFields.completed = input.completed;
    }
    if (input.priority !== undefined) {
      updateFields.priority = input.priority;
    }

    // Update the todo with only the provided fields
    const result = await db.update(todosTable)
      .set(updateFields)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Convert date string back to Date object for return
    const updatedTodo = result[0];
    return {
      ...updatedTodo,
      due_date: updatedTodo.due_date ? new Date(updatedTodo.due_date) : null
    };
  } catch (error) {
    console.error('Todo update failed:', error);
    throw error;
  }
};