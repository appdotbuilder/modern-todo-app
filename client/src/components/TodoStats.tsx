import { ListTodo, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Todo } from '../../../server/src/schema';

interface TodoStatsProps {
  todos: Todo[];
}

export function TodoStats({ todos }: TodoStatsProps) {
  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const highPriorityCount = todos.filter((todo: Todo) => todo.priority === 'High' && !todo.completed).length;

  const stats = [
    {
      icon: ListTodo,
      value: todos.length,
      label: 'Total todos',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: CheckCircle2,
      value: completedCount,
      label: 'Completed',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: AlertCircle,
      value: highPriorityCount,
      label: 'High priority',
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${stat.bgColor} rounded-full`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}