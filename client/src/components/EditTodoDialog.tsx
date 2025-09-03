import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import type { Todo, UpdateTodoInput, Priority } from '../../../server/src/schema';

interface EditTodoDialogProps {
  todo: Todo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (data: UpdateTodoInput) => Promise<void>;
  isLoading?: boolean;
}

export function EditTodoDialog({ 
  todo, 
  open, 
  onOpenChange, 
  onUpdate, 
  isLoading = false 
}: EditTodoDialogProps) {
  const [formData, setFormData] = useState<UpdateTodoInput>({
    id: 0,
    title: '',
    description: null,
    due_date: null,
    completed: false,
    priority: null
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Update form data when todo changes
  useEffect(() => {
    if (todo) {
      setFormData({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        due_date: todo.due_date,
        completed: todo.completed,
        priority: todo.priority
      });
    }
  }, [todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    
    await onUpdate(formData);
    onOpenChange(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev: UpdateTodoInput) => ({
      ...prev,
      due_date: date || null
    }));
    setCalendarOpen(false);
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev: UpdateTodoInput) => ({
      ...prev,
      priority: value === 'none' ? null : (value as Priority)
    }));
  };

  if (!todo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-blue-600" />
            Edit Todo
          </DialogTitle>
          <DialogDescription>
            Make changes to your todo item. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={formData.title || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: UpdateTodoInput) => ({ ...prev, title: e.target.value }))
              }
              placeholder="What needs to be done? ✨"
              required
            />
          </div>

          <div>
            <Textarea
              value={formData.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: UpdateTodoInput) => ({
                  ...prev,
                  description: e.target.value || null
                }))
              }
              placeholder="Add a description... 📝"
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? (
                      format(formData.due_date, 'PPP')
                    ) : (
                      <span className="text-muted-foreground">Pick a due date 📅</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date || undefined}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                  {formData.due_date && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDateSelect(undefined)}
                        className="w-full"
                      >
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <Select value={formData.priority || 'none'} onValueChange={handlePriorityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Set priority 🎯" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No priority</SelectItem>
                  <SelectItem value="Low">🟢 Low</SelectItem>
                  <SelectItem value="Medium">🟡 Medium</SelectItem>
                  <SelectItem value="High">🔴 High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title?.trim()}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}