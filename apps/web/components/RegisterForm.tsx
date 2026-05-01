'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  registerSchema,
  type RegisterFormInputs,
} from '@/lib/validation/schemas'
import { apiPost, setAuthToken } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth.store'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface RegisterResponse {
  token: string
  user: {
    id: string
    fullName: string
    email: string
    phone?: string
    role: 'requester' | 'volunteer' | 'coordinator'
    district: string
    city?: string
  }
}

const roles = [
  { value: 'requester', label: 'Relief Requester' },
  { value: 'volunteer', label: 'Volunteer (Requires Approval)' },
]

const districts = [
  'North',
  'South',
  'East',
  'West',
  'Central',
  'Northeast',
  'Southwest',
]

const predefinedSkills = [
  'Medical Support',
  'Search & Rescue',
  'Logistics',
  'Cooking',
  'Driving',
  'Construction',
  'Water Management',
  'Counseling',
  'Communications',
  'Sanitation',
]

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()

  const form = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      role: 'requester',
      skills: [],
      district: '',
      city: '',
    },
  })

  async function onSubmit(values: RegisterFormInputs) {
    setIsLoading(true)
    try {
      const { confirmPassword, ...registerData } = values

      const response = await apiPost<RegisterResponse>(
        '/api/v1/auth/register',
        registerData,
      )

      // Store auth data
      setAuthToken(response.token)
      login(response.user, response.token)

      const message = values.role === 'volunteer'
        ? 'Account created successfully! Please wait for coordinator approval.'
        : 'Account created successfully'

      toast({
        title: 'Success',
        description: message,
      })

      router.push(values.role === 'volunteer' ? '/login' : '/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      const message =
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
      toast({
        title: 'Registration Failed',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Register to start coordinating relief efforts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('role') === 'volunteer' && (
              <div className="space-y-3">
                <FormLabel>Skills <span className="text-red-500">*</span></FormLabel>
                <p className="text-xs text-muted-foreground">
                  Select at least one skill you can contribute
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {predefinedSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={skill}
                        checked={form.watch('skills')?.includes(skill) || false}
                        onCheckedChange={(checked) => {
                          const currentSkills = form.watch('skills') || []
                          const updatedSkills = checked
                            ? [...currentSkills, skill]
                            : currentSkills.filter(s => s !== skill)
                          form.setValue('skills', updatedSkills)
                        }}
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={skill}
                        className="text-sm cursor-pointer"
                      >
                        {skill}
                      </label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.skills && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.skills.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>District</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City name"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
