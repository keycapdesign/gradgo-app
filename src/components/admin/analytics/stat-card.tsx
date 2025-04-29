import { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  total?: number;
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  total,
  isLoading = false,
}: StatCardProps) {
  // Calculate percentage if total is provided
  const percentage = total ? Math.round((Number(value) / total) * 100) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-muted"></div>
        ) : (
          <div className="text-2xl font-bold">
            {value}
            {percentage !== null && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({percentage}%)
              </span>
            )}
          </div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}
