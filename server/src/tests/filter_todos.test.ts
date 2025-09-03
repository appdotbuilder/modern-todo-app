import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type FilterTodosInput } from '../schema';
import { filterTodos } from '../handlers/filter_todos';

describe('filterTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test todos
  const createTestTodos = async () => {
    const testTodos = [
      {
        title: 'High Priority Completed Todo',
        description: 'A completed high priority task',
        due_date: '2024-01-15',
        completed: true,
        priority: 'High' as const
      },
      {
        title: 'Medium Priority Incomplete Todo',
        description: 'An incomplete medium priority task',
        due_date: null,
        completed: false,
        priority: 'Medium' as const
      },
      {
        title: 'Low Priority Completed Todo',
        description: 'A completed low priority task',
        due_date: '2024-02-01',
        completed: true,
        priority: 'Low' as const
      },
      {
        title: 'No Priority Incomplete Todo',
        description: null,
        due_date: null,
        completed: false,
        priority: null
      },
      {
        title: 'High Priority Incomplete Todo',
        description: 'An incomplete high priority task',
        due_date: '2024-01-30',
        completed: false,
        priority: 'High' as const
      }
    ];

    // Insert test todos with slight delay to ensure different timestamps
    for (let i = 0; i < testTodos.length; i++) {
      await db.insert(todosTable).values(testTodos[i]).execute();
      // Small delay to ensure different created_at timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };

  it('should return all todos when no filters provided', async () => {
    await createTestTodos();
    
    const input: FilterTodosInput = {};
    const result = await filterTodos(input);

    expect(result).toHaveLength(5);
    
    // Should be ordered by creation date (newest first)
    const timestamps = result.map(todo => todo.created_at.getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
    }

    // Verify proper type conversion
    result.forEach(todo => {
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
      if (todo.due_date) {
        expect(todo.due_date).toBeInstanceOf(Date);
      }
    });
  });

  it('should filter by completion status only', async () => {
    await createTestTodos();
    
    // Filter for completed todos
    const completedInput: FilterTodosInput = { completed: true };
    const completedResult = await filterTodos(completedInput);

    expect(completedResult).toHaveLength(2);
    completedResult.forEach(todo => {
      expect(todo.completed).toBe(true);
    });

    // Filter for incomplete todos
    const incompleteInput: FilterTodosInput = { completed: false };
    const incompleteResult = await filterTodos(incompleteInput);

    expect(incompleteResult).toHaveLength(3);
    incompleteResult.forEach(todo => {
      expect(todo.completed).toBe(false);
    });
  });

  it('should filter by priority only', async () => {
    await createTestTodos();
    
    // Filter for high priority todos
    const highPriorityInput: FilterTodosInput = { priority: 'High' };
    const highPriorityResult = await filterTodos(highPriorityInput);

    expect(highPriorityResult).toHaveLength(2);
    highPriorityResult.forEach(todo => {
      expect(todo.priority).toBe('High');
    });

    // Filter for medium priority todos
    const mediumPriorityInput: FilterTodosInput = { priority: 'Medium' };
    const mediumPriorityResult = await filterTodos(mediumPriorityInput);

    expect(mediumPriorityResult).toHaveLength(1);
    expect(mediumPriorityResult[0].priority).toBe('Medium');

    // Filter for low priority todos
    const lowPriorityInput: FilterTodosInput = { priority: 'Low' };
    const lowPriorityResult = await filterTodos(lowPriorityInput);

    expect(lowPriorityResult).toHaveLength(1);
    expect(lowPriorityResult[0].priority).toBe('Low');
  });

  it('should filter by both completion status and priority (AND condition)', async () => {
    await createTestTodos();
    
    // Filter for completed high priority todos
    const completedHighInput: FilterTodosInput = { 
      completed: true, 
      priority: 'High' 
    };
    const completedHighResult = await filterTodos(completedHighInput);

    expect(completedHighResult).toHaveLength(1);
    expect(completedHighResult[0].completed).toBe(true);
    expect(completedHighResult[0].priority).toBe('High');
    expect(completedHighResult[0].title).toBe('High Priority Completed Todo');

    // Filter for incomplete high priority todos
    const incompleteHighInput: FilterTodosInput = { 
      completed: false, 
      priority: 'High' 
    };
    const incompleteHighResult = await filterTodos(incompleteHighInput);

    expect(incompleteHighResult).toHaveLength(1);
    expect(incompleteHighResult[0].completed).toBe(false);
    expect(incompleteHighResult[0].priority).toBe('High');
    expect(incompleteHighResult[0].title).toBe('High Priority Incomplete Todo');

    // Filter for completed medium priority todos (should return empty)
    const completedMediumInput: FilterTodosInput = { 
      completed: true, 
      priority: 'Medium' 
    };
    const completedMediumResult = await filterTodos(completedMediumInput);

    expect(completedMediumResult).toHaveLength(0);
  });

  it('should return empty array when no todos match filters', async () => {
    await createTestTodos();
    
    // Filter for a combination that doesn't exist
    const nonExistentInput: FilterTodosInput = { 
      completed: true, 
      priority: 'Medium' 
    };
    const result = await filterTodos(nonExistentInput);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle empty database gracefully', async () => {
    // No test data created
    const input: FilterTodosInput = { completed: true };
    const result = await filterTodos(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should maintain proper ordering with mixed timestamps', async () => {
    // Create todos with known order
    const todo1 = await db.insert(todosTable).values({
      title: 'First Todo',
      completed: false,
      priority: 'Low'
    }).returning().execute();

    await new Promise(resolve => setTimeout(resolve, 50));

    const todo2 = await db.insert(todosTable).values({
      title: 'Second Todo',
      completed: false,
      priority: 'Low'
    }).returning().execute();

    await new Promise(resolve => setTimeout(resolve, 50));

    const todo3 = await db.insert(todosTable).values({
      title: 'Third Todo',
      completed: false,
      priority: 'Low'
    }).returning().execute();

    const input: FilterTodosInput = { priority: 'Low' };
    const result = await filterTodos(input);

    expect(result).toHaveLength(3);
    // Should be ordered newest first
    expect(result[0].title).toBe('Third Todo');
    expect(result[1].title).toBe('Second Todo');
    expect(result[2].title).toBe('First Todo');
  });

  it('should handle null values correctly', async () => {
    // Create todo with null priority
    await db.insert(todosTable).values({
      title: 'Null Priority Todo',
      description: null,
      due_date: null,
      completed: false,
      priority: null
    }).execute();

    // Create todo with actual priority
    await db.insert(todosTable).values({
      title: 'High Priority Todo',
      completed: false,
      priority: 'High'
    }).execute();

    // Filter should not return null priority todo when filtering by specific priority
    const highPriorityInput: FilterTodosInput = { priority: 'High' };
    const highPriorityResult = await filterTodos(highPriorityInput);

    expect(highPriorityResult).toHaveLength(1);
    expect(highPriorityResult[0].priority).toBe('High');
    expect(highPriorityResult[0].title).toBe('High Priority Todo');

    // Get all todos to verify both exist
    const allInput: FilterTodosInput = {};
    const allResult = await filterTodos(allInput);

    expect(allResult).toHaveLength(2);
    
    // Check null values are properly handled
    const nullPriorityTodo = allResult.find(todo => todo.priority === null);
    expect(nullPriorityTodo).toBeDefined();
    expect(nullPriorityTodo!.description).toBeNull();
    expect(nullPriorityTodo!.due_date).toBeNull();
  });
});