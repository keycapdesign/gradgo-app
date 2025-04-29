import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type CheckoutStatus =
  | "processing" // Initial state when checkout is initiated
  | "payment_pending" // Waiting for payment on terminal
  | "sending_to_print" // Payment completed, creating print orders
  | "success" // Print orders created successfully
  | "error" // Error occurred

interface CheckoutStatusProps {
  status: CheckoutStatus
  onClose?: () => void
}

export function CheckoutStatusScreen({ status, onClose }: CheckoutStatusProps) {
  console.log('CheckoutStatusScreen rendered with status:', status)

  // Track the previous status for animation purposes
  const [prevStatus, setPrevStatus] = useState<CheckoutStatus>(status)
  const [direction, setDirection] = useState<1 | -1>(1) // 1 = forward, -1 = backward
  const [countdown, setCountdown] = useState(5) // 5 seconds countdown
  // No longer need canTransition state

  // Ensure each status is shown for a minimum time
  useEffect(() => {
    // Set minimum display times for each status (except success which has its own timer)
    if (status !== 'success') {
      const minDisplayTime = {
        processing: 1000,      // 1 second
        payment_pending: 1000, // 1 second
        sending_to_print: 2000, // 2 seconds
        error: 2000           // 2 seconds
      }[status] || 1000;

      console.log(`Setting minimum display time of ${minDisplayTime}ms for ${status}`);
    }
  }, [status]);

  // Update direction when status changes
  useEffect(() => {
    console.log('Status changed from', prevStatus, 'to', status)
    if (status !== prevStatus) {
      // Determine if we're moving forward or backward in the flow
      const statusOrder: CheckoutStatus[] = [
        "processing",
        "payment_pending",
        "sending_to_print",
        "success"
      ]

      const prevIndex = statusOrder.indexOf(prevStatus)
      const currentIndex = statusOrder.indexOf(status)

      // If either status is not in our ordered list (like error), default to forward
      if (prevIndex === -1 || currentIndex === -1) {
        setDirection(1)
      } else {
        setDirection(currentIndex > prevIndex ? 1 : -1)
      }

      setPrevStatus(status)
    }
  }, [status, prevStatus])

  // Auto-dismiss success screen after a delay
  useEffect(() => {
    if (status === 'success' && onClose) {
      // Reset countdown when success status is set
      setCountdown(5)

      // Set up interval for countdown and auto-dismiss
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          // When we reach 0, clear the interval and call onClose
          if (prev <= 1) {
            clearInterval(countdownInterval)
            console.log('Auto-dismissing success screen after timeout')
            // Call onClose to reset the entire form state
            setTimeout(() => {
              console.log('Auto-dismiss timeout triggered, calling onClose')
              if (onClose) onClose()
            }, 100) // Small delay to ensure the UI updates first
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        clearInterval(countdownInterval)
      }
    }
  }, [status, onClose])

  // Define content based on status
  const getContent = () => {
    switch (status) {
      case "processing":
        return {
          title: "Processing Checkout",
          message: "Please wait while we prepare your checkout...",
          showSpinner: true,
        }
      case "payment_pending":
        return {
          title: "Complete Payment",
          message: "Please complete your payment on the terminal.",
          showSpinner: true,
        }
      case "sending_to_print":
        return {
          title: "Sending to Print",
          message: "Your payment was successful. Sending your photos to print...",
          showSpinner: true,
        }
      case "success":
        return {
          title: "Success!",
          message: `Your images are being printed and will be ready shortly. This screen will close in ${countdown} second${countdown !== 1 ? 's' : ''} and reset for the next student.`,
          showSpinner: false,
        }
      case "error":
        return {
          title: "Error",
          message: "There was a problem processing your order. Please try again.",
          showSpinner: false,
        }
      default:
        return {
          title: "Processing",
          message: "Please wait...",
          showSpinner: true,
        }
    }
  }

  const content = getContent()

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2 }
    }
  }

  const textVariants = {
    hidden: {
      opacity: 0,
      x: direction > 0 ? 50 : -50
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      x: direction > 0 ? -50 : 50,
      transition: { duration: 0.2 }
    }
  }

  const spinnerVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  }

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: 0.2
      }
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.95 }
  }

  // Animation variants for the countdown text
  const countdownVariants = {
    initial: { scale: 1 },
    pulse: {
      scale: 1.2,
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className="w-full max-w-md"
        >
          <Card className="border-none bg-transparent">
            <CardHeader>
              <motion.div variants={textVariants}>
                <CardTitle className="text-center text-2xl">
                  {content.title}
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.p
                variants={textVariants}
                className="text-center text-lg"
              >
                {content.message}
              </motion.p>

              {content.showSpinner && (
                <motion.div
                  variants={spinnerVariants}
                  className="flex justify-center"
                >
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </motion.div>
              )}

              {status === "success" && (
                <>
                  <motion.div
                    variants={textVariants}
                    className="flex justify-center mt-2"
                  >
                    <motion.button
                      onClick={() => {
                        console.log('Manual close button clicked')
                        if (onClose) onClose()
                      }}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="h-12 px-6 rounded-md text-lg font-medium bg-primary text-primary-foreground"
                    >
                      Return to Gallery
                    </motion.button>
                  </motion.div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
