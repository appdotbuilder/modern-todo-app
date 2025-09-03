import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import type { CreateTodoInput, Priority } from '../../../server/src/schema';

interface TodoFormProps {
  onSubmit: (data: CreateTodoInput) => Promise<void>;
  isLoading?: boolean;
}

export function TodoForm({ onSubmit, isLoading = false }: TodoFormProps) {
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null,
    due_date: null,
    priority: null
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    await onSubmit(formData);
    
    // Reset form after successful submission
    setFormData({
      title: '',
      description: null,
      due_date: null,
      priority: null
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev: CreateTodoInput) => ({
      ...prev,
      due_date: date || null
    }));
    setCalendarOpen(false);
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev: CreateTodoInput) => ({
      ...prev,
      priority: value === 'none' ? null : (value as Priority)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-md border">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Add New Todo</h2>
      </div>
      
      <div>
        <Input
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
          }
          placeholder="What needs to be done? ✨"
          className="text-base"
          required
        />
      </div>

      <div>
        <Textarea
          value={formData.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateTodoInput) => ({
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

      <Button type="submit" disabled={isLoading || !formData.title.trim()} className="w-full">
        {isLoading ? 'Adding...' : 'Add Todo ➕'}
      </Button>
    </form>
  );
}