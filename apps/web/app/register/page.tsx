'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { RegisterForm } from '@/components/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">ReliefLink</h1>
          <p className="text-muted-foreground">
            Disaster Relief Coordination System
          </p>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <RegisterForm />
        </Suspense>

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
