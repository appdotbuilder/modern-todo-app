import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';

// Test data
const createTodoInput: CreateTodoInput = {
  title: 'Original Todo',
  description: 'Original description',
  due_date: new Date('2024-12-31'),
  priority: 'Medium'
};

const updateInput: UpdateTodoInput = {
  id: 1, // Will be set dynamically in tests
  title: 'Updated Todo',
  description: 'Updated description',
  completed: true,
  priority: 'High'
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a todo with all fields', async () => {
    // Create a todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: createTodoInput.title,
        description: createTodoInput.description,
        due_date: createTodoInput.due_date?.toISOString().split('T')[0],
        priority: createTodoInput.priority,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;

    // Update the todo
    const updatedTodo = await updateTodo({
      ...updateInput,
      id: todoId,
      due_date: new Date('2025-01-15')
    });

    // Verify the update
    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.title).toBe('Updated Todo');
    expect(updatedTodo.description).toBe('Updated description');
    expect(updatedTodo.completed).toBe(true);
    expect(updatedTodo.priority).toBe('High');
    expect(updatedTodo.due_date).toEqual(new Date('2025-01-15'));
    expect(updatedTodo.created_at).toBeInstanceOf(Date);
    expect(updatedTodo.updated_at).toBeInstanceOf(Date);
    expect(updatedTodo.updated_at > createdTodo[0].updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create a todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: createTodoInput.title,
        description: createTodoInput.description,
        due_date: createTodoInput.due_date?.toISOString().split('T')[0],
        priority: createTodoInput.priority,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;
    const originalTodo = createdTodo[0];

    // Update only the title and completed status
    const updatedTodo = await updateTodo({
      id: todoId,
      title: 'Only Title Updated',
      completed: true
    });

    // Verify only specified fields were updated
    expect(updatedTodo.title).toBe('Only Title Updated');
    expect(updatedTodo.completed).toBe(true);
    // Other fields should remain unchanged
    expect(updatedTodo.description).toBe(originalTodo.description);
    expect(updatedTodo.due_date).toEqual(new Date(originalTodo.due_date!));
    expect(updatedTodo.priority).toBe(originalTodo.priority);
    expect(updatedTodo.created_at).toEqual(originalTodo.created_at);
    expect(updatedTodo.updated_at > originalTodo.updated_at).toBe(true);
  });

  it('should update nullable fields to null', async () => {
    // Create a todo with non-null nullable fields
    const createdTodo = await db.insert(todosTable)
      .values({
        title: createTodoInput.title,
        description: createTodoInput.description,
        due_date: createTodoInput.due_date?.toISOString().split('T')[0],
        priority: createTodoInput.priority,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;

    // Update nullable fields to null
    const updatedTodo = await updateTodo({
      id: todoId,
      description: null,
      due_date: null,
      priority: null
    });

    // Verify nullable fields were set to null
    expect(updatedTodo.description).toBe(null);
    expect(updatedTodo.due_date).toBe(null);
    expect(updatedTodo.priority).toBe(null);
    expect(updatedTodo.title).toBe(createTodoInput.title); // Should remain unchanged
    expect(updatedTodo.completed).toBe(false); // Should remain unchanged
  });

  it('should save updated todo to database', async () => {
    // Create a todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: createTodoInput.title,
        description: createTodoInput.description,
        due_date: createTodoInput.due_date?.toISOString().split('T')[0],
        priority: createTodoInput.priority,
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;

    // Update the todo
    await updateTodo({
      id: todoId,
      title: 'Persisted Update',
      completed: true
    });

    // Verify the update was persisted in the database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toBe('Persisted Update');
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at > createdTodo[0].updated_at).toBe(true);
  });

  it('should throw error when todo does not exist', async () => {
    // Try to update a non-existent todo
    const nonExistentId = 999;

    await expect(
      updateTodo({
        id: nonExistentId,
        title: 'This will fail'
      })
    ).rejects.toThrow(/not found/i);
  });

  it('should handle updating completed status from true to false', async () => {
    // Create a completed todo
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'This was completed',
        completed: true
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;

    // Mark it as incomplete
    const updatedTodo = await updateTodo({
      id: todoId,
      completed: false
    });

    expect(updatedTodo.completed).toBe(false);
    expect(updatedTodo.title).toBe('Completed Todo'); // Should remain unchanged
  });

  it('should update timestamp even when no other fields change', async () => {
    // Create a todo first
    const createdTodo = await db.insert(todosTable)
      .values({
        title: 'Timestamp Test',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createdTodo[0].id;
    const originalUpdatedAt = createdTodo[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with no field changes (only timestamp should update)
    const updatedTodo = await updateTodo({
      id: todoId
    });

    expect(updatedTodo.updated_at > originalUpdatedAt).toBe(true);
    expect(updatedTodo.title).toBe('Timestamp Test'); // Should remain unchanged
    expect(updatedTodo.completed).toBe(false); // Should remain unchanged
  });
});