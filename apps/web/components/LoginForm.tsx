'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormInputs } from '@/lib/validation/schemas'
import { apiPost, setAuthToken } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth.store'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginResponse {
  token: string
  user: {
    id: string
    fullName: string
    email: string
    phone?: string
    role: 'requester' | 'volunteer' | 'coordinator' | 'admin'
    district: string
    city?: string
  }
}

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()

  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'coordinator@relieflink.local',
      password: 'Admin@123',
    },
  })

  async function onSubmit(values: LoginFormInputs) {
    setIsLoading(true)
    try {
      const response = await apiPost<LoginResponse>(
        '/api/v1/auth/login',
        values,
      )

      // Store auth data
      setAuthToken(response.token)
      login(response.user, response.token)

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      const message =
        error instanceof Error ? error.message : 'Login failed. Please try again.'
      toast({
        title: 'Login Failed',
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
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              Don't have an account?{' '}
              <a href="/register" className="text-primary hover:underline">
                Sign up
              </a>
            </div>
          </form>
        </Form>

        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs text-muted-foreground">Demo Credentials:</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>Email: coordinator@relieflink.local</li>
            <li>Password: Admin@123</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
