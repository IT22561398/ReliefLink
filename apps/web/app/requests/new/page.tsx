'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiPost } from '@/lib/api/client'
import { AlertCircle, Plus } from 'lucide-react'

type RequestCategory = 'water' | 'food' | 'medicine' | 'shelter' | 'rescue' | 'transport' | 'other'
type UrgencyLevel = 'low' | 'medium' | 'high'

interface CreateRequestForm {
  category: RequestCategory
  description: string
  urgency: UrgencyLevel
  district: string
  city: string
  peopleCount: number
}

export default function NewRequestPage() {
  const router = useRouter()
  const [form, setForm] = useState<CreateRequestForm>({
    category: 'water',
    description: '',
    urgency: 'high',
    district: '',
    city: '',
    peopleCount: 1,
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!form.district || !form.city) {
      setMessage('District and city are required')
      setMessageType('error')
      return
    }

    if (form.peopleCount < 1) {
      setMessage('People count must be at least 1')
      setMessageType('error')
      return
    }

    try {
      setIsLoading(true)
      const data = await apiPost<{ id: string }>('/api/v1/requests', {
        ...form,
        peopleCount: Number(form.peopleCount),
      })

      setMessage(`Relief request created successfully! ID: ${data.id}`)
      setMessageType('success')

      setTimeout(() => {
        router.push('/requests')
      }, 2000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create request')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof CreateRequestForm, value: any) => {
    setForm({
      ...form,
      [field]: value,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Plus className="h-8 w-8" />
            <h1 className="text-4xl font-bold tracking-tight">Create Relief Request</h1>
          </div>
          <p className="text-muted-foreground">
            Submit a new relief request to mobilize volunteers and resources for disaster response
          </p>
        </div>

        {/* Form */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New Request Details</CardTitle>
            <CardDescription>Provide detailed information about the relief request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select value={form.category} onValueChange={(value) => handleChange('category', value as RequestCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="medicine">Medicine</SelectItem>
                    <SelectItem value="shelter">Shelter</SelectItem>
                    <SelectItem value="rescue">Rescue</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description *
                </label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the relief request..."
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="min-h-32"
                  required
                />
              </div>

              {/* Urgency */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Urgency Level *</label>
                <Select value={form.urgency} onValueChange={(value) => handleChange('urgency', value as UrgencyLevel)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="district" className="text-sm font-medium">
                    District *
                  </label>
                  <Input
                    id="district"
                    placeholder="Enter district name"
                    value={form.district}
                    onChange={(e) => handleChange('district', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    City *
                  </label>
                  <Input
                    id="city"
                    placeholder="Enter city name"
                    value={form.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* People Count */}
              <div className="space-y-2">
                <label htmlFor="peopleCount" className="text-sm font-medium">
                  Estimated People Affected *
                </label>
                <Input
                  id="peopleCount"
                  type="number"
                  min="1"
                  value={form.peopleCount}
                  onChange={(e) => handleChange('peopleCount', e.target.value)}
                  required
                />
              </div>

              {/* Message */}
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

              {/* Buttons */}
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} size="lg">
                  {isLoading ? 'Creating...' : 'Create Request'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
