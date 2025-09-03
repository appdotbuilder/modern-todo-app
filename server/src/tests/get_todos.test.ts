import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
  });

  it('should return all todos ordered by creation date (newest first)', async () => {
    // Create test todos with different creation times
    const todo1 = await db.insert(todosTable)
      .values({
        title: 'First Todo',
        description: 'This was created first',
        completed: false
      })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const todo2 = await db.insert(todosTable)
      .values({
        title: 'Second Todo',
        description: 'This was created second',
        completed: true,
        priority: 'High'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const todo3 = await db.insert(todosTable)
      .values({
        title: 'Third Todo',
        description: null,
        due_date: '2024-12-31',
        completed: false,
        priority: 'Low'
      })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Should be ordered newest first (third, second, first)
    expect(result[0].title).toEqual('Third Todo');
    expect(result[1].title).toEqual('Second Todo');
    expect(result[2].title).toEqual('First Todo');

    // Verify timestamps are properly ordered
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThan(result[2].created_at.getTime());
  });

  it('should return todos with proper field types and values', async () => {
    const dueDate = '2024-12-25';
    
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'Test description',
        due_date: dueDate,
        completed: true,
        priority: 'Medium'
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    
    const todo = result[0];
    
    // Verify all field types and values
    expect(typeof todo.id).toBe('number');
    expect(todo.title).toBe('Test Todo');
    expect(todo.description).toBe('Test description');
    expect(todo.due_date).toBeInstanceOf(Date);
    expect(todo.due_date?.toISOString().split('T')[0]).toBe('2024-12-25');
    expect(todo.completed).toBe(true);
    expect(todo.priority).toBe('Medium');
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);
  });

  it('should handle todos with null values correctly', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Minimal Todo',
        description: null,
        due_date: null,
        completed: false,
        priority: null
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    
    const todo = result[0];
    
    expect(todo.title).toBe('Minimal Todo');
    expect(todo.description).toBeNull();
    expect(todo.due_date).toBeNull();
    expect(todo.completed).toBe(false);
    expect(todo.priority).toBeNull();
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);
  });

  it('should handle todos with all priority levels', async () => {
    // Create todos with different priority levels
    await db.insert(todosTable)
      .values([
        {
          title: 'Low Priority Todo',
          priority: 'Low',
          completed: false
        },
        {
          title: 'Medium Priority Todo', 
          priority: 'Medium',
          completed: false
        },
        {
          title: 'High Priority Todo',
          priority: 'High',
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify priority values
    const priorities = result.map(todo => todo.priority).sort();
    expect(priorities).toEqual(['High', 'Low', 'Medium']);
  });

  it('should return multiple todos with mixed completion statuses', async () => {
    await db.insert(todosTable)
      .values([
        {
          title: 'Completed Todo 1',
          completed: true
        },
        {
          title: 'Incomplete Todo 1', 
          completed: false
        },
        {
          title: 'Completed Todo 2',
          completed: true
        },
        {
          title: 'Incomplete Todo 2',
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(4);
    
    const completedCount = result.filter(todo => todo.completed).length;
    const incompleteCount = result.filter(todo => !todo.completed).length;
    
    expect(completedCount).toBe(2);
    expect(incompleteCount).toBe(2);
  });
});