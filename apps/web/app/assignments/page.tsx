'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { apiGet, apiPost } from '@/lib/api/client'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, AlertCircle } from 'lucide-react'

interface Assignment {
  id: string
  requestId: string
  volunteerId?: string
  resourceId?: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  assignedAt: string
  volunteerName?: string
  resourceName?: string
}

type AssignmentStatus = 'pending' | 'active' | 'completed' | 'failed'

const getStatusColor = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' | 'success' => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'active':
      return 'default'
    case 'failed':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default function AssignmentsPage() {
  const router = useRouter()
  const [requestId, setRequestId] = useState('')
  const [volunteerId, setVolunteerId] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!requestId) {
      setMessage('Request ID is required')
      setMessageType('error')
      return
    }

    try {
      setIsLoading(true)
      const data = await apiPost<{ id: string }>('/api/v1/assignments', {
        requestId,
        volunteerId: volunteerId || undefined,
        resourceId: resourceId || undefined,
      })

      setMessage(`Assignment created: ${data.id}`)
      setMessageType('success')

      // Reset form
      setVolunteerId('')
      setResourceId('')

      // Reload assignments for this request
      await loadAssignments(requestId)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create assignment')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssignments = async (reqId: string) => {
    if (!reqId) return

    try {
      setIsLoading(true)
      const data = await apiGet<Assignment[]>(`/api/v1/assignments/${reqId}`)
      setAssignments(data || [])
    } catch (error) {
      console.error('Failed to load assignments:', error)
      setAssignments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadAssignments = () => {
    if (requestId) {
      loadAssignments(requestId)
    }
  }

  const columns: ColumnDef<Assignment>[] = [
    {
      accessorKey: 'id',
      header: 'Assignment ID',
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('id')}</span>,
    },
    {
      accessorKey: 'volunteerId',
      header: 'Volunteer',
      cell: ({ row }) => <span>{row.original.volunteerName || row.getValue('volunteerId') || '-'}</span>,
    },
    {
      accessorKey: 'resourceId',
      header: 'Resource',
      cell: ({ row }) => <span>{row.original.resourceName || row.getValue('resourceId') || '-'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusColor(row.getValue('status') as string)}>
          {row.getValue('status')}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignedAt',
      header: 'Assigned At',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.getValue('assignedAt') as string).toLocaleDateString()}</span>,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">Create and manage volunteer and resource assignments to requests</p>
        </div>

        {/* Create Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Assignment
            </CardTitle>
            <CardDescription>Assign volunteers or resources to relief requests</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="requestId" className="text-sm font-medium">
                    Request ID *
                  </label>
                  <Input
                    id="requestId"
                    placeholder="Enter request ID"
                    value={requestId}
                    onChange={(e) => setRequestId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="volunteerId" className="text-sm font-medium">
                    Volunteer ID (optional)
                  </label>
                  <Input
                    id="volunteerId"
                    placeholder="Enter volunteer ID"
                    value={volunteerId}
                    onChange={(e) => setVolunteerId(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="resourceId" className="text-sm font-medium">
                  Resource ID (optional)
                </label>
                <Input
                  id="resourceId"
                  placeholder="Enter resource ID"
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                />
              </div>

              {message && (
                <div
                  className={`rounded-lg border p-4 flex gap-2 ${
                    messageType === 'error'
                      ? 'border-destructive/50 bg-destructive/10 text-destructive'
                      : 'border-green-500/50 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200'
                  }`}
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{message}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading || !requestId}>
                  {isLoading ? 'Creating...' : 'Create Assignment'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadAssignments}
                  disabled={isLoading || !requestId}
                >
                  Load History
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Assignments List */}
        {assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assignments for Request {requestId}</CardTitle>
              <CardDescription>{assignments.length} assignments found</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={assignments}
                isLoading={isLoading}
                searchPlaceholder="Search assignments..."
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
