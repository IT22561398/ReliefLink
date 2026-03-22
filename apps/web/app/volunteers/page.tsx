'use client'

import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import { DataTable } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiGet } from '@/lib/api/client'
import { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

interface Volunteer {
  id: string
  userId: string
  skillSet: string[]
  district: string
  city: string
  availabilityStatus: 'available' | 'unavailable' | 'limited'
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Volunteer[]>('/api/v1/volunteers')
        setVolunteers(data || [])
      } catch (error) {
        console.error('Failed to load volunteers:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const columns: ColumnDef<Volunteer>[] = [
    {
      accessorKey: 'district',
      header: 'Location',
      cell: ({ row }) => <span className="text-sm">{row.original.district}, {row.original.city}</span>,
    },
    {
      accessorKey: 'skillSet',
      header: 'Skills',
      cell: ({ row }) => <span className="text-sm">{row.original.skillSet.join(', ') || 'None'}</span>,
    },
    {
      accessorKey: 'availabilityStatus',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.availabilityStatus === 'available' ? 'default' : 'outline'}>
          {row.original.availabilityStatus}
        </Badge>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Volunteers</h1>
            <p className="text-muted-foreground">Manage volunteer registry and assignments</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Register Volunteer
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Volunteers</CardTitle>
            <CardDescription>{volunteers.length} volunteers registered</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={volunteers} isLoading={isLoading} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
