import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodoById } from '../handlers/get_todo_by_id';
import { type Todo } from '../schema';
import { eq } from 'drizzle-orm';

describe('getTodoById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return todo when found', async () => {
    // Create a test todo
    const testTodo = {
      title: 'Test Todo',
      description: 'This is a test todo',
      due_date: '2024-12-31',
      completed: false,
      priority: 'High' as const
    };

    const insertResult = await db.insert(todosTable)
      .values(testTodo)
      .returning()
      .execute();

    const createdTodo = insertResult[0];

    // Fetch the todo by ID
    const result = await getTodoById(createdTodo.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdTodo.id);
    expect(result!.title).toBe('Test Todo');
    expect(result!.description).toBe('This is a test todo');
    expect(result!.completed).toBe(false);
    expect(result!.priority).toBe('High');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.due_date).toBeInstanceOf(Date);
  });

  it('should return null when todo not found', async () => {
    const result = await getTodoById(999);
    expect(result).toBeNull();
  });

  it('should handle todo with null fields correctly', async () => {
    // Create a minimal todo with nullable fields set to null
    const minimalTodo = {
      title: 'Minimal Todo',
      description: null,
      due_date: null,
      completed: true,
      priority: null
    };

    const insertResult = await db.insert(todosTable)
      .values(minimalTodo)
      .returning()
      .execute();

    const createdTodo = insertResult[0];

    // Fetch the todo by ID
    const result = await getTodoById(createdTodo.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdTodo.id);
    expect(result!.title).toBe('Minimal Todo');
    expect(result!.description).toBeNull();
    expect(result!.due_date).toBeNull();
    expect(result!.completed).toBe(true);
    expect(result!.priority).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle todos with different priorities', async () => {
    // Create todos with different priorities
    const priorities = ['Low', 'Medium', 'High'] as const;
    const createdTodos = [];

    for (const priority of priorities) {
      const todo = {
        title: `${priority} Priority Todo`,
        description: `A todo with ${priority} priority`,
        due_date: null,
        completed: false,
        priority
      };

      const insertResult = await db.insert(todosTable)
        .values(todo)
        .returning()
        .execute();

      createdTodos.push(insertResult[0]);
    }

    // Test fetching each todo
    for (let i = 0; i < createdTodos.length; i++) {
      const result = await getTodoById(createdTodos[i].id);
      expect(result).not.toBeNull();
      expect(result!.priority).toBe(priorities[i]);
      expect(result!.title).toBe(`${priorities[i]} Priority Todo`);
    }
  });

  it('should verify database state after fetching', async () => {
    // Create a test todo
    const testTodo = {
      title: 'Database State Test',
      description: 'Testing database consistency',
      due_date: '2024-06-15',
      completed: false,
      priority: 'Medium' as const
    };

    const insertResult = await db.insert(todosTable)
      .values(testTodo)
      .returning()
      .execute();

    const createdTodo = insertResult[0];

    // Fetch using handler
    const handlerResult = await getTodoById(createdTodo.id);

    // Verify by querying database directly
    const directQuery = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(handlerResult).not.toBeNull();
    expect(directQuery).toHaveLength(1);
    expect(handlerResult!.title).toBe(directQuery[0].title);
    expect(handlerResult!.description).toBe(directQuery[0].description);
    expect(handlerResult!.completed).toBe(directQuery[0].completed);
    expect(handlerResult!.priority).toBe(directQuery[0].priority);
  });
});