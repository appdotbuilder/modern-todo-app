import { Skeleton } from '@/components/ui/skeleton';

export function TodoSkeleton() {
  return (
    <div className="p-4 rounded-lg border bg-white space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-5 w-5 rounded flex-shrink-0 mt-1" />
        <div className="flex-grow space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}

export function TodoListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <TodoSkeleton key={index} />
      ))}
    </div>
  );
}