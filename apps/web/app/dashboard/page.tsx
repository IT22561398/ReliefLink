'use client'

import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import { DashboardStats } from '@/components/DashboardStats'
import { apiGet } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    requestCount: 0,
    volunteerCount: 0,
    resourceCount: 0,
    notificationCount: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [requests, volunteers, resources, notifications] = await Promise.allSettled(
          [
            apiGet<unknown[]>('/api/v1/requests', { headers: { 'no-toast': 'true' } }),
            apiGet<unknown[]>('/api/v1/volunteers', { headers: { 'no-toast': 'true' } }),
            apiGet<unknown[]>('/api/v1/resources', { headers: { 'no-toast': 'true' } }),
            user?.id ? apiGet<unknown[]>(`/api/v1/notifications/user/${user.id}`, { headers: { 'no-toast': 'true' } }) : Promise.resolve([]),
          ],
        )

        const getCount = (result: PromiseSettledResult<unknown[]>) =>
          result.status === 'fulfilled' ? result.value.length : 0

        setStats({
          requestCount: getCount(requests),
          volunteerCount: getCount(volunteers),
          resourceCount: getCount(resources),
          notificationCount: getCount(notifications),
        })
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
        setStats({
          requestCount: 0,
          volunteerCount: 0,
          resourceCount: 0,
          notificationCount: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [user?.id])

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {user?.role === 'volunteer'
              ? `Welcome back, ${user?.fullName}! Browse relief requests and help those in need.`
              : user?.role === 'requester'
              ? `Welcome back, ${user?.fullName}! Create and manage your relief requests.`
              : user?.role === 'coordinator'
              ? `Welcome back, ${user?.fullName}! Manage relief coordination and volunteer assignments.`
              : `Welcome back, ${user?.fullName}! Here's an overview of your relief coordination activities.`}
          </p>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <DashboardStats
            requestCount={stats.requestCount}
            volunteerCount={stats.volunteerCount}
            resourceCount={stats.resourceCount}
            notificationCount={stats.notificationCount}
          />
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>
                {user?.role === 'volunteer'
                  ? 'Actions for volunteers'
                  : 'Quick actions to manage relief efforts'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Show "Create Relief Request" only for requesters and coordinators */}
              {(user?.role === 'requester' ||
                user?.role === 'coordinator') && (
                <a
                  href="/requests/new"
                  className="block rounded-lg border border-border p-3 text-center transition hover:bg-accent"
                >
                  Create Relief Request
                </a>
              )}

              {/* Show "View Volunteers" for everyone except volunteers themselves */}
              {user?.role !== 'volunteer' && (
                <a
                  href="/volunteers"
                  className="block rounded-lg border border-border p-3 text-center transition hover:bg-accent"
                >
                  View Volunteers
                </a>
              )}

              {/* Show "Browse Requests" for volunteers */}
              {user?.role === 'volunteer' && (
                <a
                  href="/requests"
                  className="block rounded-lg border border-border p-3 text-center transition hover:bg-accent"
                >
                  Browse Requests
                </a>
              )}

              {/* Show "Manage Resources" only for coordinators */}
              {user?.role === 'coordinator' && (
                <a
                  href="/resources"
                  className="block rounded-lg border border-border p-3 text-center transition hover:bg-accent"
                >
                  Manage Resources
                </a>
              )}

              {/* Show "View My Assignments" for volunteers */}
              {user?.role === 'volunteer' && (
                <a
                  href="/assignments"
                  className="block rounded-lg border border-border p-3 text-center transition hover:bg-accent"
                >
                  My Assignments
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Role</CardTitle>
              <CardDescription>Current permissions and responsibilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-sm font-medium capitalize text-primary">
                    {user?.role}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {user?.district && user?.city
                    ? `Assigned to ${user.district}, ${user.city}`
                    : 'Not assigned to a location'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'volunteer'
                  ? 'No recent activity. Start by browsing relief requests and joining assignments.'
                  : user?.role === 'requester'
                  ? 'No recent activity. Start by creating a relief request.'
                  : 'No recent activity. Start by reviewing pending requests or assigning volunteers.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
