import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import { gownCompositionSetsQueryOptions } from '@/utils/gown-compositions'
import { GownSchemaManager } from '@/components/admin/gown-schema-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GownCompositionUpload } from '@/components/admin/gown-composition-upload'

export const Route = createFileRoute('/_protected/admin/events/$eventId/gown-schemas')({
  loader: ({ params }) => {
    return {
      eventId: params.eventId,
      title: `Gown Schemas for Event ${params.eventId}`
    }
  },
  errorComponent: ({ error }) => {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading gown schemas</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message || 'An unknown error occurred'}</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    to="/admin/events/$eventId"
                    params={{ eventId: Route.useParams().eventId }}
                    className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Back to Event
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  component: GownSchemasPage,
})

function GownSchemasPage() {
  const { eventId } = Route.useParams()
  const navigate = useNavigate()

  // Fetch gown composition sets for this event
  const { data: compositionSets } = useSuspenseQuery(gownCompositionSetsQueryOptions(parseInt(eventId)))

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gown Schemas</h1>
          <p className="text-muted-foreground">
            Manage gown compositions and schemas for this event
          </p>
        </div>
        <Link
          to="/admin/events/$eventId"
          params={{ eventId }}
          className="inline-block"
        >
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Button>
        </Link>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading gown schemas...</span>
        </div>
      }>
        <Tabs defaultValue="manual">
          <TabsList className="mb-4">
            <TabsTrigger value="manual">Manual Schema Definition</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <GownSchemaManager
              eventId={parseInt(eventId)}
              existingSchemas={compositionSets}
            />
          </TabsContent>

          <TabsContent value="csv">
            <Card>
              <CardHeader>
                <CardTitle>CSV Upload</CardTitle>
                <CardDescription>
                  Upload a CSV file with gown composition data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GownCompositionUpload eventId={parseInt(eventId)} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
  )
}
