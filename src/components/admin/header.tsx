import { useMatches } from '@tanstack/react-router'
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/admin/mode-toggle"

export function SiteHeader() {
  const matches = useMatches()
  
  // Find the most specific route that has a title
  const titleMatch = [...matches].reverse().find(match => {
    const loaderData = match.loaderData as { title?: string } | undefined
    return loaderData?.title !== undefined
  })
  const title = (titleMatch?.loaderData as { title?: string } | undefined)?.title || 'Dashboard'
  
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full justify-between px-4 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-base font-medium">{title}</h1>
        </div>
        <ModeToggle />
      </div>
    </header>
  )
}