import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string | React.ReactNode
  value: string | number
  description?: string
  icon?: LucideIcon
  className?: string
  iconClassName?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className={cn("h-4 w-4 text-muted-foreground", iconClassName)} />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
