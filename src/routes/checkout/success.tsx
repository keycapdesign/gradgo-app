import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/checkout/success')({
  component: CheckoutSuccessView,
})

function CheckoutSuccessView() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(10)

  // Auto-redirect after countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate({ to: '/' })
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, navigate])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Your payment has been processed successfully. You will receive an email confirmation shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            If you purchased digital downloads, they will be available in your gallery.
            If you purchased prints, they will be processed and delivered according to the event schedule.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            onClick={() => navigate({ to: '/' })}
            className="w-full"
          >
            Return to Home
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Redirecting in {countdown} seconds...
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
