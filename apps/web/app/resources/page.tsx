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

interface Resource {
  id: string
  ownerId: string
  category: string
  quantity: number
  district: string
  city: string
  availabilityStatus: 'available' | 'unavailable' | 'limited'
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet<Resource[]>('/api/v1/resources')
        setResources(data || [])
      } catch (error) {
        console.error('Failed to load resources:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const columns: ColumnDef<Resource>[] = [
    {
      accessorKey: 'category',
      header: 'Type',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorKey: 'district',
      header: 'Location',
      cell: ({ row }) => <span className="text-sm">{row.original.district}, {row.original.city}</span>,
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
            <h1 className="text-4xl font-bold tracking-tight">Resources</h1>
            <p className="text-muted-foreground">Manage disaster relief resources and inventory</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Resource
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Available Resources</CardTitle>
            <CardDescription>{resources.length} total resources</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={resources} isLoading={isLoading} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
