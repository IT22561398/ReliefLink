'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth.store'
import { setAuthToken } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogOut, Menu } from 'lucide-react'
import { useState } from 'react'

interface NavBarProps {
  showSidebar?: boolean
  onToggleSidebar?: () => void
}

export default function NavBar({ showSidebar, onToggleSidebar }: NavBarProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    setAuthToken(null)
    logout()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">R</span>
            </div>
            <span className="hidden font-bold sm:inline-block">ReliefLink</span>
          </Link>
        </div>

        {/* Center - Navigation Links (hidden on mobile) */}
        <div className="hidden gap-1 lg:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/requests">Requests</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/volunteers">Volunteersddd</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/resources">Resources</Link>
          </Button>
          {user?.role === 'coordinator' && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/coordinator">Approvals</Link>
            </Button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <ThemeToggle />

          {user && (
            <>
              <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm">
                <Link href="/profile">{user.fullName}</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
