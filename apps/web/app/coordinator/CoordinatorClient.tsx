'use client'

import { useState, useEffect } from 'react'
import NavBar from '@/components/NavBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { CheckCircle, XCircle, Users, Zap, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface PendingVolunteer {
  id: string
  fullName: string
  email: string
  phone: string
  district: string
  city: string
  status: string
}

interface ActiveAssignment {
  id: string
  requestId: string
  volunteerId: string
  status: 'assigned' | 'in_progress' | 'completed'
  assignedAt: string
  volunteer?: {
    user?: {
      fullName: string
      email: string
      phone?: string
    }
  }
}

export default function CoordinatorClient() {
  const [pendingVolunteers, setPendingVolunteers] = useState<PendingVolunteer[]>([])
  const [loadingVolunteers, setLoadingVolunteers] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [activeAssignments, setActiveAssignments] = useState<ActiveAssignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)

  // Load pending volunteers
  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        setLoadingVolunteers(true)
        const data = await apiGet<PendingVolunteer[]>('/api/v1/users/volunteers/pending')
        setPendingVolunteers(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to load volunteers:', error)
        toast({
          title: 'Error',
          description: 'Failed to load pending volunteers',
          variant: 'destructive',
        })
        setPendingVolunteers([])
      } finally {
        setLoadingVolunteers(false)
      }
    }

    fetchVolunteers()
  }, [])

  // Load active assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoadingAssignments(true)
        const requests = await apiGet<any[]>('/api/v1/requests')
        if (Array.isArray(requests)) {
          const allAssignments = []
          for (const request of requests) {
            try {
              const assignments = await apiGet<any[]>(`/api/v1/assignments/${request.id}`)
              if (Array.isArray(assignments) && assignments.length > 0) {
                allAssignments.push(...assignments.filter(a => a.status !== 'completed'))
              }
            } catch (error) {
              // Silently skip if assignment fetch fails
            }
          }
          setActiveAssignments(allAssignments)
        }
      } catch (error) {
        console.error('Failed to load assignments:', error)
        setActiveAssignments([])
      } finally {
        setLoadingAssignments(false)
      }
    }

    fetchAssignments()
  }, [])

  const handleApproveVolunteer = async (volunteerId: string) => {
    try {
      setApprovingId(volunteerId)
      const volunteer = pendingVolunteers.find(v => v.id === volunteerId)

      if (!volunteer) {
        throw new Error('Volunteer not found')
      }

      // Approve volunteer in auth service
      await apiPatch(`/api/v1/users/volunteers/${volunteerId}/approve`, {})

      // Create volunteer profile in volunteer service
      try {
        await apiPost('/api/v1/volunteers', {
          userId: volunteerId,
          district: volunteer.district,
          city: volunteer.city,
          skillSet: [],
          availabilityStatus: 'available'
        })
      } catch (error) {
        console.warn('Volunteer profile creation failed, but user was approved:', error)
      }

      setPendingVolunteers(pendingVolunteers.filter(v => v.id !== volunteerId))
      toast({
        title: 'Success',
        description: `${volunteer.fullName} approved as volunteer`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve volunteer',
        variant: 'destructive',
      })
    } finally {
      setApprovingId(null)
    }
  }

  const handleRejectVolunteer = async (volunteerId: string) => {
    try {
      setRejectingId(volunteerId)
      const volunteer = pendingVolunteers.find(v => v.id === volunteerId)

      await apiPatch(`/api/v1/users/volunteers/${volunteerId}/reject`, {})

      setPendingVolunteers(pendingVolunteers.filter(v => v.id !== volunteerId))
      toast({
        title: 'Success',
        description: `${volunteer?.fullName} rejected`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject volunteer',
        variant: 'destructive',
      })
    } finally {
      setRejectingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold tracking-tight">Coordinator Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage volunteer approvals and coordinate relief operations
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Volunteers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingVolunteers.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions Required</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingVolunteers.length}</div>
              <p className="text-xs text-muted-foreground">Review and approve/reject</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Volunteer Approvals */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Volunteer Applications</CardTitle>
            <CardDescription>
              Review and approve volunteers who registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVolunteers ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading volunteers...</p>
              </div>
            ) : pendingVolunteers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-muted-foreground">No pending applications</p>
                <p className="text-sm text-muted-foreground">All volunteers have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingVolunteers.map((volunteer) => (
                  <div
                    key={volunteer.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-lg p-4 gap-4 hover:bg-accent/50 transition"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{volunteer.fullName}</h4>
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                      <p className="text-sm text-muted-foreground">
                        📍 {volunteer.city}, {volunteer.district}
                      </p>
                      <p className="text-sm text-muted-foreground">📞 {volunteer.phone}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => handleApproveVolunteer(volunteer.id)}
                        disabled={approvingId === volunteer.id || rejectingId === volunteer.id}
                      >
                        {approvingId === volunteer.id ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 sm:flex-none"
                        onClick={() => handleRejectVolunteer(volunteer.id)}
                        disabled={approvingId === volunteer.id || rejectingId === volunteer.id}
                      >
                        {rejectingId === volunteer.id ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Active Assignments</CardTitle>
            <CardDescription>
              Volunteer assignments for relief requests in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAssignments ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading assignments...</p>
              </div>
            ) : activeAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-amber-500 mb-2" />
                <p className="text-muted-foreground">No active assignments</p>
                <p className="text-sm text-muted-foreground">All requests are waiting for volunteers</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded-lg p-4 gap-4 hover:bg-accent/50 transition"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Request {assignment.requestId.slice(0, 8)}...</h4>
                        <Badge variant={
                          assignment.status === 'in_progress' ? 'default' : 'secondary'
                        }>
                          {assignment.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Volunteer: <span className="font-medium">{assignment.volunteer?.user?.fullName || 'Unknown'}</span>
                      </p>
                      {assignment.volunteer?.user?.phone && (
                        <p className="text-sm text-muted-foreground">
                          📞 {assignment.volunteer.user.phone}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <Badge variant={
                        assignment.status === 'in_progress' ? 'default' : 'secondary'
                      }>
                        {assignment.status === 'in_progress' ? '🔄 In Progress' : '✓ Assigned'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
