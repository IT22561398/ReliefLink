'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth.store'
import NavBar from '@/components/NavBar'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiGet, apiPost } from '@/lib/api/client'
import { ColumnDef } from '@tanstack/react-table'
import { Plus, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Request {
  id: string
  category: string
  description?: string
  urgency: 'low' | 'medium' | 'high'
  district: string
  city: string
  peopleCount: number
  status: 'pending' | 'matched' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
}

interface VolunteerAssignmentInfo {
  id: string
  volunteerId: string
  status: 'assigned' | 'in_progress' | 'completed'
  volunteer?: {
    user?: {
      id: string
      fullName: string
      email: string
      phone?: string
    }
    skillSet?: string[]
    district?: string
    city?: string
  }
}

type BadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'success'

const getUrgencyColor = (urgency: string): BadgeVariant => {
  return urgency === 'high' ? 'destructive' : urgency === 'medium' ? 'secondary' : 'outline'
}

const getStatusColor = (status: string): BadgeVariant => {
  const colors: Record<string, BadgeVariant> = {
    completed: 'success',
    in_progress: 'default',
    assigned: 'secondary',
    pending: 'outline',
    cancelled: 'destructive',
    matched: 'secondary',
  }
  return colors[status] || 'outline'
}

export default function RequestsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [requests, setRequests] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [volunteerAssignment, setVolunteerAssignment] = useState<any>(null)
  const [selectedRequestAssignment, setSelectedRequestAssignment] = useState<VolunteerAssignmentInfo | null>(null)
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false)

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await apiGet<Request[]>('/api/v1/requests')
        setRequests(data || [])
      } catch (error) {
        console.error('Failed to load requests:', error)
        setRequests([])
      } finally {
        setIsLoading(false)
      }
    }

    const loadVolunteerAssignment = async () => {
      if (user?.role !== 'volunteer' || !user?.id) return
      try {
        // Get volunteer profile to get volunteer id
        const volunteers = await apiGet<any[]>('/api/v1/volunteers')
        const volunteerProfile = volunteers?.find(v => v.userId === user.id)
        if (volunteerProfile) {
          const assignment = await apiGet<any>(`/api/v1/assignments/volunteer/${volunteerProfile.id}/current`)
          setVolunteerAssignment(assignment)
        }
      } catch (error) {
        console.error('Failed to load volunteer assignment:', error)
      }
    }

    loadRequests()
    loadVolunteerAssignment()
  }, [user?.id, user?.role])

  const handleAcceptRequest = async () => {
    if (!selectedRequest || user?.role !== 'volunteer') return

    setIsAccepting(true)
    try {
      const result = await apiPost('/api/v1/assignments/self-accept', {
        requestId: selectedRequest.id
      })

      toast({
        title: 'Success!',
        description: `You have accepted the request. Requester has been notified.`,
      })

      setSelectedRequest(null)
      setSelectedRequestAssignment(null)
      // Reload assignment
      const volunteers = await apiGet<any[]>('/api/v1/volunteers')
      const volunteerProfile = volunteers?.find(v => v.userId === user?.id)
      if (volunteerProfile) {
        const assignment = await apiGet<any>(`/api/v1/assignments/volunteer/${volunteerProfile.id}/current`)
        setVolunteerAssignment(assignment)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error?.message || 'Failed to accept request',
        variant: 'destructive'
      })
    } finally {
      setIsAccepting(false)
    }
  }

  const handleViewRequest = async (request: Request) => {
    setSelectedRequest(request)
    setSelectedRequestAssignment(null)

    // For requesters, try to fetch the volunteer assignment
    if (user?.role === 'requester') {
      setIsLoadingAssignment(true)
      try {
        const assignment = await apiGet<VolunteerAssignmentInfo>(`/api/v1/assignments/${request.id}`)
        if (assignment && Array.isArray(assignment) && assignment.length > 0) {
          setSelectedRequestAssignment(assignment[0])
        }
      } catch (error) {
        console.error('Failed to load assignment:', error)
      } finally {
        setIsLoadingAssignment(false)
      }
    }
  }

  const getRoleTitle = () => {
    if (user?.role === 'requester') {
      return 'My Relief Requests'
    } else if (user?.role === 'volunteer') {
      return 'Available Relief Requests'
    } else if (user?.role === 'coordinator') {
      return 'Regional Relief Requests'
    } else {
      return 'All Relief Requests'
    }
  }

  const getRoleDescription = () => {
    if (user?.role === 'requester') {
      return 'Track and manage relief requests you have submitted'
    } else if (user?.role === 'volunteer') {
      return 'View available relief requests you can help with'
    } else if (user?.role === 'coordinator') {
      return 'Manage relief requests in your region'
    } else {
      return 'Monitor all disaster relief requests in the system'
    }
  }

  const columns: ColumnDef<Request>[] = [
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <span className="capitalize font-medium">{row.getValue('category')}</span>,
    },
    {
      accessorKey: 'district',
      header: 'Location',
      cell: ({ row }) => <span className="text-sm">{row.original.district}, {row.original.city}</span>,
    },
    {
      accessorKey: 'peopleCount',
      header: 'People',
      cell: ({ row }) => <span>{row.getValue('peopleCount')}</span>,
    },
    {
      accessorKey: 'urgency',
      header: 'Urgency',
      cell: ({ row }) => (
        <Badge variant={getUrgencyColor(row.getValue('urgency') as string)}>
          {row.getValue('urgency')}
        </Badge>
      ),
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
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => {
        const isVolunteerAssigned = user?.role === 'volunteer' && volunteerAssignment?.requestId === row.original.id
        const canAccept = user?.role === 'volunteer' && !volunteerAssignment && row.original.status !== 'completed' && row.original.status !== 'cancelled'

        return (
          <Button
            size="sm"
            variant={isVolunteerAssigned ? 'outline' : 'default'}
            onClick={() => handleViewRequest(row.original)}
            disabled={isVolunteerAssigned}
          >
            {isVolunteerAssigned ? 'Assigned ✓' : canAccept ? 'I Can Help' : 'View'}
          </Button>
        )
      }
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{getRoleTitle()}</h1>
            <p className="text-muted-foreground">{getRoleDescription()}</p>
          </div>
          {user?.role === 'requester' && (
            <Button onClick={() => router.push('/requests/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          )}
        </div>

        {/* Volunteer Assignment Status */}
        {user?.role === 'volunteer' && volunteerAssignment && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-900">Current Assignment</p>
                  <p className="text-sm text-green-800">Request: {volunteerAssignment.requestId}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-green-800">Status:</span>
                    <Badge variant="secondary">{volunteerAssignment.status}</Badge>
                  </div>
                </div>
                <Button onClick={() => router.push('/volunteer/assignment')}>Update Status</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Relief Requests</CardTitle>
            <CardDescription>{requests.length} request(s) available</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={requests}
              isLoading={isLoading}
              searchPlaceholder="Search by category, location..."
            />
          </CardContent>
        </Card>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <Card className="fixed inset-0 z-50 m-4 overflow-auto bg-white md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[90vh] md:w-full md:max-w-md">
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4"
                onClick={() => {
                  setSelectedRequest(null)
                  setSelectedRequestAssignment(null)
                }}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Category</p>
                <p className="capitalize">{selectedRequest.category}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Location</p>
                <p>{selectedRequest.district}, {selectedRequest.city}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">People Count</p>
                <p>{selectedRequest.peopleCount} people</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Urgency</p>
                <Badge variant={getUrgencyColor(selectedRequest.urgency)}>
                  {selectedRequest.urgency}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Status</p>
                <Badge variant={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              </div>
              {selectedRequest.description && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>
              )}

              {/* Volunteer Details - For Requesters */}
              {user?.role === 'requester' && (
                <>
                  {isLoadingAssignment ? (
                    <div className="py-4 text-center">
                      <p className="text-sm text-muted-foreground">Loading volunteer info...</p>
                    </div>
                  ) : selectedRequestAssignment ? (
                    <div className="border-t pt-4 space-y-4">
                      <div className="rounded-lg bg-green-50 p-4">
                        <p className="font-semibold text-green-900 mb-3">✓ Volunteer Assigned!</p>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-green-800 uppercase">Volunteer Name</p>
                            <p className="text-sm font-medium text-green-900">
                              {selectedRequestAssignment.volunteer?.user?.fullName || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-green-800 uppercase">Status</p>
                            <Badge variant="secondary" className="mt-1">
                              {selectedRequestAssignment.status === 'in_progress' ? 'In Progress' : selectedRequestAssignment.status === 'assigned' ? 'Ready to Help' : 'Completed'}
                            </Badge>
                          </div>

                          {selectedRequestAssignment.volunteer?.user?.phone && (
                            <div>
                              <p className="text-xs font-semibold text-green-800 uppercase">Phone</p>
                              <p className="text-sm text-green-900">
                                <a href={`tel:${selectedRequestAssignment.volunteer.user.phone}`} className="underline">
                                  {selectedRequestAssignment.volunteer.user.phone}
                                </a>
                              </p>
                            </div>
                          )}

                          {selectedRequestAssignment.volunteer?.user?.email && (
                            <div>
                              <p className="text-xs font-semibold text-green-800 uppercase">Email</p>
                              <p className="text-sm text-green-900">
                                <a href={`mailto:${selectedRequestAssignment.volunteer.user.email}`} className="underline">
                                  {selectedRequestAssignment.volunteer.user.email}
                                </a>
                              </p>
                            </div>
                          )}

                          {selectedRequestAssignment.volunteer?.skillSet && selectedRequestAssignment.volunteer.skillSet.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-green-800 uppercase">Skills</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {selectedRequestAssignment.volunteer.skillSet.map((skill, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-4">
                      <p className="text-sm text-muted-foreground">No volunteer assigned yet</p>
                    </div>
                  )}
                </>
              )}

              {/* Accept Button - For Volunteers */}
              {user?.role === 'volunteer' && !volunteerAssignment && (
                <Button
                  className="mt-6 w-full"
                  onClick={handleAcceptRequest}
                  disabled={isAccepting}
                >
                  {isAccepting ? 'Accepting...' : 'I Can Help'}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {selectedRequest && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => {
              setSelectedRequest(null)
              setSelectedRequestAssignment(null)
            }}
          />
        )}
      </main>
    </div>
  )
}
