import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SettingsTabs } from '@/components/admin/settings/settings-tabs'

export const Route = createFileRoute('/_protected/admin/settings/')({
  validateSearch: z.object({
    tab: z.enum(['app', 'account', 'users']).optional(),
  }),
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <SettingsTabs />
    </div>
  )
}
