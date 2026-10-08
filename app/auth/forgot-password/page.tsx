'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GraduationCap, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')
    const confirm = String(formData.get('confirm') || '')
    if (password !== confirm) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }
    const result = await resetPassword(email, password)
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }
    setDone(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-foreground">ScholarSync</span>
          </Link>
        </div>
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Set a new password</CardTitle>
            <CardDescription className="text-center">
              Accounts are stored on this computer, so you can choose a new password here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="space-y-4 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-primary" />
                <p className="text-sm text-muted-foreground">Your password has been updated.</p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input id="password" name="password" type="password" required minLength={6} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input id="confirm" name="confirm" type="password" required minLength={6} disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
