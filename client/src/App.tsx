import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { trpc } from '@/utils/trpc';
import { TodoForm } from '@/components/TodoForm';
import { TodoItem } from '@/components/TodoItem';
import { TodoFilters } from '@/components/TodoFilters';
import { EditTodoDialog } from '@/components/EditTodoDialog';
import { EmptyState } from '@/components/EmptyState';
import { TodoStats } from '@/components/TodoStats';
import { TodoListSkeleton } from '@/components/TodoSkeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, ListTodo, Sparkles, AlertCircle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput, FilterTodosInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [filters, setFilters] = useState<FilterTodosInput>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Load all todos on mount
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter todos based on current filters
  const applyFilters = useCallback(async () => {
    try {
      if (Object.keys(filters).length === 0) {
        // No filters, show all todos
        setFilteredTodos(todos);
      } else {
        // Apply server-side filtering
        const result = await trpc.filterTodos.query(filters);
        setFilteredTodos(result);
      }
    } catch (error) {
      console.error('Failed to filter todos:', error);
      // Fallback to client-side filtering
      let filtered = [...todos];
      
      if (filters.completed !== undefined) {
        filtered = filtered.filter((todo: Todo) => todo.completed === filters.completed);
      }
      
      if (filters.priority !== undefined) {
        filtered = filtered.filter((todo: Todo) => todo.priority === filters.priority);
      }
      
      setFilteredTodos(filtered);
    }
  }, [todos, filters]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCreateTodo = async (data: CreateTodoInput) => {
    setIsCreating(true);
    try {
      const newTodo = await trpc.createTodo.mutate(data);
      setTodos((prev: Todo[]) => [newTodo, ...prev]);
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTodo = async (data: UpdateTodoInput) => {
    setIsUpdating(true);
    try {
      const updatedTodo = await trpc.updateTodo.mutate(data);
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) => todo.id === data.id ? updatedTodo : todo)
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setDeletingIds((prev: Set<number>) => new Set(prev).add(id));
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    } finally {
      setDeletingIds((prev: Set<number>) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleFiltersChange = (newFilters: FilterTodosInput) => {
    setFilters(newFilters);
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
  };



  if (isLoading && todos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-600 rounded-full">
                <ListTodo className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                Todo App
                <Sparkles className="inline ml-2 h-6 w-6 text-yellow-500" />
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Stay organized and get things done! ✨
            </p>
          </div>
          
          <div className="text-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your todos...</p>
          </div>
          
          <TodoListSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <ListTodo className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Todo App
              <Sparkles className="inline ml-2 h-6 w-6 text-yellow-500" />
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Stay organized and get things done! ✨
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <TodoStats todos={todos} />
        </div>

        {/* Add Todo Form */}
        <div className="mb-6">
          <TodoForm onSubmit={handleCreateTodo} isLoading={isCreating} />
        </div>

        {/* Filters */}
        {todos.length > 0 && (
          <div className="mb-6">
            <TodoFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              totalCount={todos.length}
              filteredCount={filteredTodos.length}
            />
          </div>
        )}

        {/* Todo List */}
        <div className="space-y-4">
          {todos.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No todos yet"
              description="Create your first todo above to get started! 🚀"
            />
          ) : filteredTodos.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No todos match your filters"
              description="Try adjusting your filters to see more todos."
              action={{
                label: "Clear filters",
                onClick: () => setFilters({})
              }}
            />
          ) : (
            <>
              {/* Section headers based on completion status */}
              {filters.completed === undefined && (
                <>
                  {/* Incomplete todos */}
                  {filteredTodos.some((todo: Todo) => !todo.completed) && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">To Do</h2>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {filteredTodos.filter((todo: Todo) => !todo.completed).length}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {filteredTodos
                          .filter((todo: Todo) => !todo.completed)
                          .map((todo: Todo) => (
                            <TodoItem
                              key={todo.id}
                              todo={todo}
                              onUpdate={handleUpdateTodo}
                              onDelete={handleDeleteTodo}
                              onEdit={handleEditTodo}
                              isUpdating={isUpdating}
                              isDeleting={deletingIds.has(todo.id)}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Separator */}
                  {filteredTodos.some((todo: Todo) => !todo.completed) && 
                   filteredTodos.some((todo: Todo) => todo.completed) && (
                    <div className="py-2">
                      <Separator />
                    </div>
                  )}

                  {/* Completed todos */}
                  {filteredTodos.some((todo: Todo) => todo.completed) && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">Completed</h2>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {filteredTodos.filter((todo: Todo) => todo.completed).length}
                        </Badge>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="space-y-3">
                        {filteredTodos
                          .filter((todo: Todo) => todo.completed)
                          .map((todo: Todo) => (
                            <TodoItem
                              key={todo.id}
                              todo={todo}
                              onUpdate={handleUpdateTodo}
                              onDelete={handleDeleteTodo}
                              onEdit={handleEditTodo}
                              isUpdating={isUpdating}
                              isDeleting={deletingIds.has(todo.id)}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Show all todos when filtering */}
              {filters.completed !== undefined && (
                <div className="space-y-3">
                  {filteredTodos.map((todo: Todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onUpdate={handleUpdateTodo}
                      onDelete={handleDeleteTodo}
                      onEdit={handleEditTodo}
                      isUpdating={isUpdating}
                      isDeleting={deletingIds.has(todo.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Todo Dialog */}
        <EditTodoDialog
          todo={editingTodo}
          open={editingTodo !== null}
          onOpenChange={(open: boolean) => !open && setEditingTodo(null)}
          onUpdate={handleUpdateTodo}
          isLoading={isUpdating}
        />
      </div>
    </div>
  );
}

export default App;