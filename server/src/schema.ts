import { z } from 'zod';

// Priority enum schema
export const prioritySchema = z.enum(['Low', 'Medium', 'High']);
export type Priority = z.infer<typeof prioritySchema>;

// Todo item schema
export const todoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Nullable field, can be explicitly null
  due_date: z.coerce.date().nullable(), // Nullable date field with automatic coercion
  completed: z.boolean(),
  priority: prioritySchema.nullable(), // Nullable priority field
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type Todo = z.infer<typeof todoSchema>;

// Input schema for creating todo items
export const createTodoInputSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'), // Required with validation
  description: z.string().nullable().optional(), // Can be null or undefined
  due_date: z.coerce.date().nullable().optional(), // Optional nullable date
  priority: prioritySchema.nullable().optional() // Optional nullable priority
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

// Input schema for updating todo items
export const updateTodoInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title cannot be empty').optional(),
  description: z.string().nullable().optional(), // Can be null or undefined
  due_date: z.coerce.date().nullable().optional(),
  completed: z.boolean().optional(),
  priority: prioritySchema.nullable().optional()
});

export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;

// Input schema for filtering todos
export const filterTodosInputSchema = z.object({
  completed: z.boolean().optional(),
  priority: prioritySchema.optional()
});

export type FilterTodosInput = z.infer<typeof filterTodosInputSchema>;

// Input schema for deleting todos
export const deleteTodoInputSchema = z.object({
  id: z.number()
});

export type DeleteTodoInput = z.infer<typeof deleteTodoInputSchema>;