'use client'

import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiGet } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth.store'
import { ColumnDef } from '@tanstack/react-table'
import { Phone } from 'lucide-react'

interface Notification {
  id: string
  message: string
  createdAt: string
  type?: 'info' | 'warning' | 'error' | 'success'
}

interface StatusEvent {
  id: string
  oldStatus: string
  newStatus: string
  changedBy: string
  timestamp: string
}

const getNotificationTypeBadge = (type?: string) => {
  switch (type) {
    case 'error':
      return 'destructive'
    case 'warning':
      return 'secondary'
    case 'success':
      return 'success'
    default:
      return 'default'
  }
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [requestId, setRequestId] = useState('')
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }
      try {
        const data = await apiGet<Notification[]>(`/api/v1/notifications/user/${user.id}`)
        setNotifications(data || [])
      } catch (error) {
        console.error('Failed to load notifications:', error)
        setNotifications([])
      } finally {
        setIsLoading(false)
      }
    }
    loadNotifications()
  }, [user?.id])

  const loadStatusEvents = async () => {
    if (!requestId) return
    setEventsLoading(true)
    try {
      const data = await apiGet<StatusEvent[]>(`/api/v1/status-events/request/${requestId}`)
      setStatusEvents(data || [])
    } catch (error) {
      console.error('Failed to load status events:', error)
      setStatusEvents([])
    } finally {
      setEventsLoading(false)
    }
  }

  const notificationColumns: ColumnDef<Notification>[] = [
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => <span className="text-sm">{row.getValue('message')}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant={getNotificationTypeBadge(row.getValue('type') as string)}>
          {row.getValue('type') || 'info'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.getValue('createdAt') as string).toLocaleDateString()}</span>,
    },
  ]

  const eventColumns: ColumnDef<StatusEvent>[] = [
    {
      accessorKey: 'oldStatus',
      header: 'From Status',
      cell: ({ row }) => <span className="capitalize font-medium">{row.getValue('oldStatus')}</span>,
    },
    {
      accessorKey: 'newStatus',
      header: 'To Status',
      cell: ({ row }) => <span className="capitalize font-medium">{row.getValue('newStatus')}</span>,
    },
    {
      accessorKey: 'changedBy',
      header: 'Changed By',
      cell: ({ row }) => <span className="text-sm">{row.getValue('changedBy')}</span>,
    },
    {
      accessorKey: 'timestamp',
      header: 'Date',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.getValue('timestamp') as string).toLocaleDateString()}</span>,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with relief coordination activities and status changes</p>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>{notifications.length} notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={notificationColumns}
              data={notifications}
              isLoading={isLoading}
              searchPlaceholder="Search notifications..."
            />
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Request Status Timeline</CardTitle>
            <CardDescription>Track status changes for a specific request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Request ID"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-1"
              />
              <Button onClick={loadStatusEvents} disabled={!requestId || eventsLoading}>
                {eventsLoading ? 'Loading...' : 'Load Timeline'}
              </Button>
            </div>

            {statusEvents.length > 0 && (
              <div className="mt-4">
                <DataTable
                  columns={eventColumns}
                  data={statusEvents}
                  isLoading={eventsLoading}
                  searchPlaceholder="Search status events..."
                />
              </div>
            )}

            {statusEvents.length === 0 && requestId && !eventsLoading && (
              <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">No status events found for this request</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
