import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Users, MapPin, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">ReliefLink</h1>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="space-y-12 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Disaster Relief Coordination System
          </h2>
          <p className="text-xl text-muted-foreground">
            Connect relief requesters, volunteers, and coordinators to efficiently
            manage disaster relief efforts and save lives.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Start Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <p className="text-center text-muted-foreground">
            A complete platform for coordinating disaster relief efforts
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Heart className="mb-2 h-8 w-8 text-destructive" />
              <CardTitle>Relief Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and manage disaster relief requests with priority levels
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Volunteers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Register volunteers and track their skills and availability
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="mb-2 h-8 w-8 text-accent" />
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage and allocate resources across affected areas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="mb-2 h-8 w-8 text-yellow-500" />
              <CardTitle>Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get instant notifications on request status and assignments
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="space-y-8 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Ready to Make a Difference?</h2>
          <p className="mb-6 text-muted-foreground">
            Join ReliefLink today and be part of coordinated disaster relief efforts
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Get Started Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/95 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>&copy; 2026 ReliefLink. Dedicated to disaster relief coordination.</p>
        </div>
      </footer>
    </div>
  )
}
