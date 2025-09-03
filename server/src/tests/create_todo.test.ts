import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test inputs with all required fields
const basicTodoInput: CreateTodoInput = {
  title: 'Basic Test Todo',
  description: 'A basic todo for testing',
  due_date: new Date('2024-12-31'),
  priority: 'Medium'
};

const minimalTodoInput: CreateTodoInput = {
  title: 'Minimal Todo'
  // All other fields are optional and will be null/default
};

const nullFieldsTodoInput: CreateTodoInput = {
  title: 'Todo with Nulls',
  description: null,
  due_date: null,
  priority: null
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with all fields', async () => {
    const result = await createTodo(basicTodoInput);

    // Verify all fields are correctly set
    expect(result.title).toEqual('Basic Test Todo');
    expect(result.description).toEqual('A basic todo for testing');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.toISOString().split('T')[0]).toEqual('2024-12-31');
    expect(result.completed).toEqual(false);
    expect(result.priority).toEqual('Medium');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with minimal fields', async () => {
    const result = await createTodo(minimalTodoInput);

    // Verify required fields
    expect(result.title).toEqual('Minimal Todo');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify optional fields default to null
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.priority).toBeNull();
  });

  it('should create a todo with explicitly null fields', async () => {
    const result = await createTodo(nullFieldsTodoInput);

    expect(result.title).toEqual('Todo with Nulls');
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.priority).toBeNull();
    expect(result.completed).toEqual(false);
  });

  it('should save todo to database correctly', async () => {
    const result = await createTodo(basicTodoInput);

    // Query the database to verify the todo was saved
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    
    const savedTodo = todos[0];
    expect(savedTodo.title).toEqual('Basic Test Todo');
    expect(savedTodo.description).toEqual('A basic todo for testing');
    expect(savedTodo.completed).toEqual(false);
    expect(savedTodo.priority).toEqual('Medium');
    expect(savedTodo.created_at).toBeInstanceOf(Date);
    expect(savedTodo.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different priority values', async () => {
    const lowPriorityInput: CreateTodoInput = {
      title: 'Low Priority Task',
      priority: 'Low'
    };

    const highPriorityInput: CreateTodoInput = {
      title: 'High Priority Task', 
      priority: 'High'
    };

    const lowResult = await createTodo(lowPriorityInput);
    const highResult = await createTodo(highPriorityInput);

    expect(lowResult.priority).toEqual('Low');
    expect(highResult.priority).toEqual('High');
  });

  it('should handle date conversion correctly', async () => {
    const dateInput: CreateTodoInput = {
      title: 'Date Test Todo',
      due_date: new Date('2025-06-15T10:30:00Z')
    };

    const result = await createTodo(dateInput);

    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.toISOString().split('T')[0]).toEqual('2025-06-15');
  });

  it('should set timestamps automatically', async () => {
    const beforeCreation = new Date();
    
    const result = await createTodo(minimalTodoInput);
    
    const afterCreation = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should create multiple todos independently', async () => {
    const todo1Input: CreateTodoInput = {
      title: 'First Todo',
      priority: 'High'
    };

    const todo2Input: CreateTodoInput = {
      title: 'Second Todo',
      priority: 'Low'
    };

    const result1 = await createTodo(todo1Input);
    const result2 = await createTodo(todo2Input);

    // Verify they have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Todo');
    expect(result2.title).toEqual('Second Todo');
    expect(result1.priority).toEqual('High');
    expect(result2.priority).toEqual('Low');
  });
});