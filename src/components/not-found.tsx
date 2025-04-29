import * as React from 'react'
import { Link, useRouter } from '@tanstack/react-router'

export function NotFound({ children }: { children?: any }) {
  const router = useRouter()
  const [isMounted, setIsMounted] = React.useState(false)

  // Only run client-side code after component is mounted
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleGoBack = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      window.history.back()
    } else {
      router.history.back()
    }
  }, [router])

  return (
    <div className="space-y-2 p-2">
      <div className="text-gray-600 dark:text-gray-400">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex items-center gap-2 flex-wrap">
        {isMounted ? (
          <>
            <button
              onClick={handleGoBack}
              className="bg-emerald-500 text-white px-2 py-1 rounded uppercase font-black text-sm"
            >
              Go back
            </button>
            <Link
              to="/login"
              className="bg-cyan-600 text-white px-2 py-1 rounded uppercase font-black text-sm"
            >
              Start Over
            </Link>
          </>
        ) : (
          <>
            <div className="h-6 bg-emerald-500/30 rounded w-20"></div>
            <div className="h-6 bg-cyan-600/30 rounded w-20"></div>
          </>
        )}
      </p>
    </div>
  )
}