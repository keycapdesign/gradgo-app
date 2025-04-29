import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { deleteGownCompositionSet, setActiveGownCompositionSet } from "@/utils/gown-compositions"
import type { GownCompositionSet } from '@/utils/gown-compositions';
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


// Define the schema for pattern-based gown composition
const patternSchemaFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parent_pattern: z.string().min(1, "Parent pattern is required"),
  gown_pattern: z.string().optional(),
  hood_pattern: z.string().optional(),
  cap_pattern: z.string().optional(),
  bonnet_pattern: z.string().optional(),
  example_parent_ean: z.string().min(1, "Example parent EAN is required"),
  phd_degrees: z.string().optional(),
  bonnet_degrees: z.string().optional(),
})

type PatternSchemaFormValues = z.infer<typeof patternSchemaFormSchema>

interface GownSchemaManagerProps {
  eventId: number
  existingSchemas?: GownCompositionSet[]
  onSuccess?: () => void
}

export function GownSchemaManager({ eventId, existingSchemas = [], onSuccess }: GownSchemaManagerProps) {
  const [activeTab, setActiveTab] = useState("pattern")
  const queryClient = useQueryClient()

  // Set up mutation for deleting a schema
  const deleteSchemaSetMutation = useMutation({
    mutationFn: async ({ compositionSetId }: { compositionSetId: number }) => {
      return deleteGownCompositionSet({ data: { compositionSetId } })
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["event", eventId, "gownCompositionSets"] })
      // Call the onSuccess callback if provided
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast.error(`Failed to delete schema: ${error.message}`)
    }
  })



  // Initialize the pattern-based schema form with default values
  const patternForm = useForm<PatternSchemaFormValues>({
    resolver: zodResolver(patternSchemaFormSchema),
    defaultValues: {
      name: "",
      description: "",
      parent_pattern: "HIRE-[university]-[degree]-SET-[size]-[modifier]",
      gown_pattern: "[university]-GWN-[degree]-[size]",
      hood_pattern: "[university]-HD-[degree]",
      cap_pattern: "GA-FMB-[color]-[modifier]",
      bonnet_pattern: "GA-TB-[color]-[accent]-[modifier]",
      example_parent_ean: "HIRE-01-ARU-SET-FND-42-L",
      phd_degrees: "PHD,DBA",
      bonnet_degrees: "PHD,DBA",
    },
  })





  // Create a mutation for saving the pattern-based schema
  const createPatternSchemaMutation = useMutation({
    mutationFn: async (values: PatternSchemaFormValues) => {
      const supabase = createClient()

      // First, create a new composition set
      const { data: compositionSet, error: setError } = await supabase
        .from("gown_composition_sets")
        .insert({
          name: values.name,
          description: values.description || null,
          event_id: eventId,
          schema_type: "pattern_definition",
          is_active: false,
          // Store the patterns in the metadata field
          metadata: {
            parent_pattern: values.parent_pattern,
            gown_pattern: values.gown_pattern,
            hood_pattern: values.hood_pattern,
            cap_pattern: values.cap_pattern,
            bonnet_pattern: values.bonnet_pattern,
            example_parent_ean: values.example_parent_ean,
            phd_degrees: values.phd_degrees || "",
            bonnet_degrees: values.bonnet_degrees || ""
          }
        })
        .select("id")
        .single()

      if (setError) throw new Error(`Error creating schema: ${setError.message}`)

      return compositionSet.id
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["event", eventId, "gownCompositionSets"] })
      toast.success("Pattern-based schema created successfully!")
      patternForm.reset()
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast.error(`Failed to create schema: ${error.message}`)
    },
  })



  // Handle pattern form submission
  const onPatternSubmit = (values: PatternSchemaFormValues) => {
    createPatternSchemaMutation.mutate(values)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Gown Schema Manager</CardTitle>
        <CardDescription>
          Create and manage gown schemas to define the components of each gown
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pattern">Create Schema</TabsTrigger>
            <TabsTrigger value="manage">Manage Schemas</TabsTrigger>
          </TabsList>



          <TabsContent value="pattern">
            <Form {...patternForm}>
              <form onSubmit={patternForm.handleSubmit(onPatternSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={patternForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schema Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ARU Graduation Pattern" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for this pattern schema
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={patternForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Pattern for ARU graduation gowns" {...field} />
                        </FormControl>
                        <FormDescription>
                          Additional details about this schema
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Pattern Definitions</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Define patterns using placeholders in square brackets [like_this]. These placeholders will be extracted from the parent EAN and used to generate component EANs.
                    </p>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                    <h4 className="text-sm font-medium text-amber-800 mb-1">Degree-Specific Components</h4>
                    <p className="text-xs text-amber-700">
                      Some degrees use different headwear. For example, PhD graduates typically wear bonnets instead of caps.
                      Define which degrees should use specific components below.
                    </p>
                  </div>

                  <FormField
                    control={patternForm.control}
                    name="parent_pattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent EAN Pattern (Required)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., HIRE-[university]-[degree]-SET-[size]-[modifier]" {...field} />
                        </FormControl>
                        <FormDescription>
                          Define the pattern for parent EANs with placeholders in [square_brackets]
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={patternForm.control}
                    name="example_parent_ean"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Example Parent EAN (Required)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., HIRE-01-ARU-SET-FND-42-L" {...field} />
                        </FormControl>
                        <FormDescription>
                          Provide an example parent EAN that matches your pattern
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={patternForm.control}
                      name="gown_pattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gown EAN Pattern</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., [university]-GWN-[degree]-[size]" {...field} />
                          </FormControl>
                          <FormDescription>
                            Pattern for gown EANs using the same placeholders
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={patternForm.control}
                      name="hood_pattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hood EAN Pattern</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., [university]-HD-[degree]" {...field} />
                          </FormControl>
                          <FormDescription>
                            Pattern for hood EANs using the same placeholders
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={patternForm.control}
                      name="cap_pattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cap EAN Pattern</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., GA-FMB-[color]-[modifier]" {...field} />
                          </FormControl>
                          <FormDescription>
                            Pattern for cap EANs using the same placeholders (used for non-PhD degrees)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={patternForm.control}
                      name="bonnet_pattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bonnet EAN Pattern</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., GA-TB-[color]-[accent]-[modifier]" {...field} />
                          </FormControl>
                          <FormDescription>
                            Pattern for bonnet EANs using the same placeholders (used for PhD degrees)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={patternForm.control}
                      name="phd_degrees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PhD-Level Degrees</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., PHD,DBA,DENG" {...field} />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of degree codes that are PhD-level (typically use different gowns)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={patternForm.control}
                      name="bonnet_degrees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bonnet-Wearing Degrees</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., PHD,DBA,DENG" {...field} />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of degree codes that use bonnets instead of caps
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <CardFooter className="px-0 pt-6">
                  <Button
                    type="submit"
                    className="ml-auto"
                    disabled={createPatternSchemaMutation.isPending}
                  >
                    {createPatternSchemaMutation.isPending ? "Creating..." : "Create Pattern Schema"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="manage">
            <div className="space-y-4">
              {existingSchemas.length > 0 ? (
                existingSchemas.map((schema) => (
                    <Card key={schema.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{schema.name}</CardTitle>
                            {schema.description && (
                              <CardDescription>{schema.description}</CardDescription>
                            )}
                            <div className="mt-2 flex gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                schema.schema_type === "pattern_definition"
                                  ? "bg-purple-100 text-purple-800"
                                  : schema.schema_type === "manual_definition"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {schema.schema_type === "pattern_definition"
                                  ? "Pattern-Based"
                                  : schema.schema_type === "manual_definition"
                                  ? "Manual"
                                  : "CSV Upload"}
                              </span>
                            </div>
                          </div>
                          {schema.is_active && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardFooter className="pt-2">
                        <div className="flex space-x-2 ml-auto">
                          {!schema.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveGownCompositionSet({ data: { compositionSetId: schema.id } })
                                  .then(() => {
                                    toast.success(`Schema "${schema.name}" set as active`);
                                    queryClient.invalidateQueries({ queryKey: ["event", eventId, "gownCompositionSets"] });
                                  })
                                  .catch(error => {
                                    toast.error(`Failed to set schema as active: ${error.message}`);
                                  });
                              }}
                            >
                              Set Active
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // For now, just show a message that editing is not yet implemented
                              toast.info(`Editing ${schema.schema_type === "pattern_definition" ? "pattern-based" : schema.schema_type === "manual_definition" ? "manual" : "CSV upload"} schemas will be available in a future update.`);
                            }}
                          >
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                              >
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the schema
                                  <strong> "{schema.name}"</strong> and all its associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    // Use the mutation to delete the schema
                                    deleteSchemaSetMutation.mutate({ compositionSetId: schema.id });
                                    // Toast is shown in the mutation's onSuccess callback
                                    toast.success(`Schema "${schema.name}" deleted successfully`);
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No manual schemas created yet. Use the "Create Schema" tab to create one.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
