'use client'

import { useAuthStore } from '@/lib/store/auth.store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Shield, Award } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [volunteerData, setVolunteerData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Fetch volunteer data if user is a volunteer
    if (user.role === 'volunteer') {
      fetchVolunteerData()
    }
  }, [user, router])

  const fetchVolunteerData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/v1/volunteers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.length > 0) {
          const currentVolunteer = data.data.find(
            (v: any) => v.userId === user?.id
          )
          if (currentVolunteer) {
            setVolunteerData(currentVolunteer)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch volunteer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const userStatus = (user as { status?: string }).status

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coordinator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'volunteer':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'requester':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-8 w-8" />
            <h1 className="text-4xl font-bold tracking-tight">My Profile</h1>
          </div>
          <p className="text-muted-foreground">
            View your account information
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your personal details and account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Full Name
              </label>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5 text-muted-foreground" />
                {user.fullName}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <div className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                {user.email}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Phone Number
              </label>
              <div className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-muted-foreground" />
                {user.phone}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Location
              </label>
              <div className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                {user.city}, {user.district}
              </div>
            </div>

            {/* Role & Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Account Role
              </label>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <Badge className={`capitalize ${getRoleColor(user.role)}`}>
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Status */}
            {userStatus && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Account Status
                </label>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={userStatus === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {userStatus}
                  </Badge>
                </div>
              </div>
            )}

            {/* Volunteer Skills */}
            {user.role === 'volunteer' && volunteerData && (
              <div className="space-y-2 border-t pt-6">
                <label className="text-sm font-medium text-muted-foreground">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {volunteerData.skillSet && volunteerData.skillSet.length > 0 ? (
                    volunteerData.skillSet.map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-2">
                        <Award className="h-3 w-3" />
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No skills added yet</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Role Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What can you do?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {user.role === 'requester' && (
                <p>
                  As a Relief Requester, you can create and manage relief requests,
                  track their status, and communicate with volunteers helping you.
                </p>
              )}
              {user.role === 'volunteer' && (
                <p>
                  As a Volunteer, you can view available relief requests, respond
                  to requests, and provide assistance to those in need.
                </p>
              )}
              {user.role === 'coordinator' && (
                <p>
                  As a Coordinator, you can manage relief requests, assign
                  volunteers, approve new volunteers, and oversee operations.
                </p>
              )}
              {(user as { role: string }).role === 'admin' && (
                <p>
                  As an Admin, you have full access to all system features including
                  user management, configuration, and administrative tasks.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                If you have questions or need assistance, please contact our support
                team or visit the help center for more information.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
