import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, CheckCircle, Circle, X } from 'lucide-react';
import type { FilterTodosInput, Priority } from '../../../server/src/schema';

interface TodoFiltersProps {
  filters: FilterTodosInput;
  onFiltersChange: (filters: FilterTodosInput) => void;
  totalCount: number;
  filteredCount: number;
}

export function TodoFilters({ 
  filters, 
  onFiltersChange, 
  totalCount, 
  filteredCount 
}: TodoFiltersProps) {
  const handleCompletedFilterChange = (value: string) => {
    const completed = value === 'all' ? undefined : value === 'completed';
    onFiltersChange({
      ...filters,
      completed
    });
  };

  const handlePriorityFilterChange = (value: string) => {
    const priority = value === 'all' ? undefined : (value as Priority);
    onFiltersChange({
      ...filters,
      priority
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.completed !== undefined || filters.priority !== undefined;

  const getCompletedFilterValue = () => {
    if (filters.completed === undefined) return 'all';
    return filters.completed ? 'completed' : 'incomplete';
  };

  const getPriorityFilterValue = () => {
    return filters.priority || 'all';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900">Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {Object.values(filters).filter(v => v !== undefined).length} active
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Showing {filteredCount} of {totalCount} todos
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2 text-xs hover:bg-red-100 hover:text-red-600"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[140px]">
          <Select value={getCompletedFilterValue()} onValueChange={handleCompletedFilterChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-gray-300"></div>
                  All todos
                </div>
              </SelectItem>
              <SelectItem value="incomplete">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4 text-gray-400" />
                  Incomplete
                </div>
              </SelectItem>
              <SelectItem value="completed">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Completed
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <Select value={getPriorityFilterValue()} onValueChange={handlePriorityFilterChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="High">🔴 High priority</SelectItem>
              <SelectItem value="Medium">🟡 Medium priority</SelectItem>
              <SelectItem value="Low">🟢 Low priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.completed !== undefined && (
            <Badge variant="outline" className="bg-blue-50 border-blue-200">
              Status: {filters.completed ? 'Completed' : 'Incomplete'}
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="outline" className="bg-blue-50 border-blue-200">
              Priority: {filters.priority}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}