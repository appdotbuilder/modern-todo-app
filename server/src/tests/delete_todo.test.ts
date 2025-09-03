import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput, type CreateTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input for creating a todo to delete
const testCreateInput: CreateTodoInput = {
  title: 'Test Todo to Delete',
  description: 'This todo will be deleted in tests',
  due_date: new Date('2024-12-31'),
  priority: 'High'
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo successfully', async () => {
    // Create a todo to delete
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        due_date: testCreateInput.due_date?.toISOString().split('T')[0], // Convert to string format for date column
        priority: testCreateInput.priority
      })
      .returning()
      .execute();

    const deleteInput: DeleteTodoInput = {
      id: createdTodo.id
    };

    const result = await deleteTodo(deleteInput);

    // Verify successful deletion response
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Todo with ID ${createdTodo.id} deleted successfully`);
  });

  it('should remove todo from database', async () => {
    // Create a todo to delete
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: testCreateInput.title,
        description: testCreateInput.description,
        due_date: testCreateInput.due_date?.toISOString().split('T')[0],
        priority: testCreateInput.priority
      })
      .returning()
      .execute();

    // Delete the todo
    await deleteTodo({ id: createdTodo.id });

    // Verify todo no longer exists in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return failure when todo does not exist', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteTodoInput = {
      id: nonExistentId
    };

    const result = await deleteTodo(deleteInput);

    // Verify failure response
    expect(result.success).toBe(false);
    expect(result.message).toBe(`Todo with ID ${nonExistentId} not found`);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple todos
    const [todo1] = await db.insert(todosTable)
      .values({
        title: 'Todo 1',
        description: 'First todo',
        priority: 'High'
      })
      .returning()
      .execute();

    const [todo2] = await db.insert(todosTable)
      .values({
        title: 'Todo 2',
        description: 'Second todo',
        priority: 'Medium'
      })
      .returning()
      .execute();

    // Delete only the first todo
    const result = await deleteTodo({ id: todo1.id });

    expect(result.success).toBe(true);

    // Verify first todo is deleted
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo1.id))
      .execute();

    expect(deletedTodos).toHaveLength(0);

    // Verify second todo still exists
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo2.id))
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toBe('Todo 2');
  });

  it('should handle deletion of todo with null fields', async () => {
    // Create a todo with minimal required data (title only)
    const [createdTodo] = await db.insert(todosTable)
      .values({
        title: 'Minimal Todo',
        description: null, // Explicitly null
        due_date: null, // Explicitly null
        priority: null // Explicitly null
      })
      .returning()
      .execute();

    const result = await deleteTodo({ id: createdTodo.id });

    expect(result.success).toBe(true);
    expect(result.message).toBe(`Todo with ID ${createdTodo.id} deleted successfully`);

    // Verify deletion from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });
});