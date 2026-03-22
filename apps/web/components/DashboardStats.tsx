'use client'

import { Activity, AlertCircle, Calendar, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend = 'neutral',
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className={cn('text-xs', {
            'text-green-600 dark:text-green-400': trend === 'up',
            'text-red-600 dark:text-red-400': trend === 'down',
            'text-muted-foreground': trend === 'neutral',
          })}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardStats({
  requestCount,
  volunteerCount,
  resourceCount,
  notificationCount,
}: {
  requestCount: number
  volunteerCount: number
  resourceCount: number
  notificationCount: number
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Requests"
        value={requestCount}
        description="Pending relief requests"
        icon={<AlertCircle className="h-4 w-4" />}
      />
      <StatCard
        title="Registered Volunteers"
        value={volunteerCount}
        description="Available to help"
        icon={<Users className="h-4 w-4" />}
      />
      <StatCard
        title="Resources"
        value={resourceCount}
        description="Available for allocation"
        icon={<Activity className="h-4 w-4" />}
      />
      <StatCard
        title="Notifications"
        value={notificationCount}
        description="Pending actions"
        icon={<Calendar className="h-4 w-4" />}
      />
    </div>
  )
}
