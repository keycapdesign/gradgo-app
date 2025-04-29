import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/kiosk')({
  component: KioskLayout,
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      throw redirect({ to: '/login' })
    }
  }
})

function KioskLayout() {
  return <Outlet />
}
