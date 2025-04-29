import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/gradgo/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/update-password',
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl text-gradgo-900 dark:text-zinc-100">Check Your Email</CardTitle>
            <CardDescription className="text-gradgo-900 dark:text-zinc-100">Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gradgo-900 dark:text-zinc-100">
              If you registered using your email and password, you will receive a password reset
              email.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl text-gradgo-900 dark:text-zinc-100">Reset Your Password</CardTitle>
            <CardDescription className="text-gradgo-900 dark:text-zinc-100">
              Type in your email and we&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gradgo-900 dark:text-zinc-100">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Type here"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button 
                type="submit" 
                className="w-full bg-gradgo-500 hover:bg-gradgo-600 text-white font-medium py-3 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send reset email'}
              </Button>
              <p className="text-sm text-gradgo-900 dark:text-zinc-100">
                Already have an account? <Link className="text-gradgo-900 dark:text-zinc-100 hover:text-zinc-500 hover:underline" to="/login">Login</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
