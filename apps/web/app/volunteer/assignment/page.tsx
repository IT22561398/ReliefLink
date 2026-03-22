'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth.store'
import NavBar from '@/components/NavBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiGet, apiPatch } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface Assignment {
  id: string
  requestId: string
  volunteerId: string
  status: 'assigned' | 'in_progress' | 'completed'
  assignedAt: string
}

interface Volunteer {
  id: string
  userId: string
  skillSet: string[]
  district: string
  city: string
}

export default function AssignmentPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (user?.role !== 'volunteer') {
      router.push('/requests')
      return
    }

    const loadAssignment = async () => {
      try {
        const volunteers = await apiGet<Volunteer[]>('/api/v1/volunteers')
        const volunteerProfile = volunteers?.find(v => v.userId === user?.id)

        if (!volunteerProfile) {
          toast({
            title: 'Error',
            description: 'Volunteer profile not found',
            variant: 'destructive'
          })
          router.push('/requests')
          return
        }

        const data = await apiGet<Assignment>(`/api/v1/assignments/volunteer/${volunteerProfile.id}/current`)
        if (!data) {
          toast({
            title: 'No Assignment',
            description: 'You do not have an active assignment',
          })
          router.push('/requests')
          return
        }
        setAssignment(data)
      } catch (error) {
        console.error('Failed to load assignment:', error)
        toast({
          title: 'Error',
          description: 'Failed to load assignment',
          variant: 'destructive'
        })
        router.push('/requests')
      } finally {
        setIsLoading(false)
      }
    }

    loadAssignment()
  }, [user, router, toast])

  const handleStatusUpdate = async (newStatus: 'in_progress' | 'completed') => {
    if (!assignment) return

    setIsUpdating(true)
    try {
      const updated = await apiPatch<Assignment>(`/api/v1/assignments/${assignment.id}/status`, {
        status: newStatus
      })

      setAssignment(updated)

      const statusText = newStatus === 'in_progress' ? 'marked as in progress' : 'marked as completed'
      toast({
        title: 'Success!',
        description: `Assignment ${statusText}. Requester has been notified.`,
      })

      if (newStatus === 'completed') {
        setTimeout(() => {
          router.push('/requests')
        }, 2000)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error?.message || 'Failed to update status',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading assignment...</p>
        </main>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Assignment not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Assignment Status</h1>
          <p className="text-muted-foreground">Update your work progress on this relief request</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Assignment</CardTitle>
            <CardDescription>Request ID: {assignment.requestId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Current Status</p>
              <Badge variant={
                assignment.status === 'completed' ? 'success' :
                assignment.status === 'in_progress' ? 'default' : 'secondary'
              }>
                {assignment.status === 'in_progress' ? 'In Progress' : assignment.status === 'assigned' ? 'Assigned' : 'Completed'}
              </Badge>
            </div>

            {/* Status Timeline */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-4">Progress Steps</p>
              <div className="space-y-4">
                {/* Assigned - Already done */}
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Assigned</p>
                    <p className="text-sm text-muted-foreground">You accepted this request</p>
                  </div>
                </div>

                {/* In Progress - Current or next */}
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    assignment.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <span className={`font-semibold ${
                      assignment.status === 'in_progress' ? 'text-blue-600' : 'text-gray-400'
                    }`}>2</span>
                  </div>
                  <div>
                    <p className={`font-medium ${
                      assignment.status === 'in_progress' ? 'text-blue-600' : 'text-muted-foreground'
                    }`}>In Progress</p>
                    <p className="text-sm text-muted-foreground">You are actively working on this</p>
                  </div>
                </div>

                {/* Completed - Final */}
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    assignment.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <span className={`font-semibold ${
                      assignment.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                    }`}>3</span>
                  </div>
                  <div>
                    <p className={`font-medium ${
                      assignment.status === 'completed' ? 'text-green-600' : 'text-muted-foreground'
                    }`}>Completed</p>
                    <p className="text-sm text-muted-foreground">Work is finished</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              {assignment.status === 'assigned' && (
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => handleStatusUpdate('in_progress')}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : '▶ Start Work'}
                </Button>
              )}

              {assignment.status === 'in_progress' && (
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={isUpdating}
                  variant="default"
                >
                  {isUpdating ? 'Updating...' : '✓ Mark Completed'}
                </Button>
              )}

              {assignment.status === 'completed' && (
                <div className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">Assignment completed!</p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => router.push('/requests')}
              >
                Back to Requests
              </Button>
            </div>

            {/* Info */}
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>The requester will be notified of each status update you make.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
