import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Edit, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import type { Todo, UpdateTodoInput } from '../../../server/src/schema';

interface TodoItemProps {
  todo: Todo;
  onUpdate: (data: UpdateTodoInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (todo: Todo) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function TodoItem({ 
  todo, 
  onUpdate, 
  onDelete, 
  onEdit, 
  isUpdating = false, 
  isDeleting = false 
}: TodoItemProps) {
  const handleToggleComplete = async () => {
    await onUpdate({
      id: todo.id,
      completed: !todo.completed
    });
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityEmoji = (priority: string | null) => {
    switch (priority) {
      case 'High': return '🔴';
      case 'Medium': return '🟡';
      case 'Low': return '🟢';
      default: return '';
    }
  };

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const getDueDateStyle = (date: Date | null, completed: boolean) => {
    if (!date || completed) return 'text-gray-500';
    if (isPast(date) && !isToday(date)) return 'text-red-500';
    if (isToday(date)) return 'text-orange-500';
    return 'text-gray-600';
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
      todo.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-lg'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-1">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggleComplete}
            disabled={isUpdating}
            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
          />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-grow">
              <h3 className={`font-medium text-lg leading-tight ${
                todo.completed 
                  ? 'line-through text-gray-500' 
                  : 'text-gray-900'
              }`}>
                {todo.title}
                {todo.completed && <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-500" />}
              </h3>
              
              {todo.description && (
                <p className={`mt-1 text-sm ${
                  todo.completed ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {todo.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {todo.priority && (
                  <Badge variant="secondary" className={getPriorityColor(todo.priority)}>
                    {getPriorityEmoji(todo.priority)} {todo.priority}
                  </Badge>
                )}
                
                {todo.due_date && (
                  <div className={`flex items-center gap-1 text-xs ${getDueDateStyle(todo.due_date, todo.completed)}`}>
                    <Calendar className="h-3 w-3" />
                    {formatDueDate(todo.due_date)}
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  Created {format(todo.created_at, 'MMM d')}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(todo)}
                disabled={isUpdating || isDeleting}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Edit className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating || isDeleting}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Todo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(todo.id)}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}