import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ExternalLink, Image as ImageIcon, Pencil, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { ImagePicker } from '@/components/admin/image-picker';
import { Feature } from '@/components/students/home/types';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

// Schema for validation
const featureSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  subtitle: z.string().optional().nullable(),
  link: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  background_path: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

type FeatureFormValues = z.infer<typeof featureSchema>;

interface EditableFeatureCardProps {
  feature: Feature;
  onUpdate: (updatedFeature: Partial<Feature>) => void;
}

export function EditableFeatureCard({ feature, onUpdate }: EditableFeatureCardProps) {
  // State for tracking which field is being edited
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Initialize form with feature data
  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      title: feature.title || '',
      subtitle: feature.subtitle || '',
      link: feature.link || '',
      background_path: feature.background_path || '',
      color: feature.color || '',
    },
    mode: 'onChange',
  });

  // Get form values
  const { watch, setValue, trigger, formState } = form;
  const title = watch('title');
  const subtitle = watch('subtitle');
  const link = watch('link');
  const backgroundPath = watch('background_path');

  // No need to track form changes separately, we can use formState.isDirty directly

  // Handle saving changes for a field
  const handleSave = async (field: keyof FeatureFormValues) => {
    try {
      // Validate the field
      const isValid = await trigger(field);

      if (isValid) {
        // Just close the editing field, don't update immediately
        setEditingField(null);
      }
    } catch (error) {
      toast.error('An error occurred while saving');
    }
  };

  // Handle canceling edits
  const handleCancel = (field: keyof FeatureFormValues) => {
    setValue(field, feature[field] || '');
    setEditingField(null);
  };

  // Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent, field: keyof FeatureFormValues) => {
    if (e.key === 'Enter') {
      handleSave(field);
    } else if (e.key === 'Escape') {
      handleCancel(field);
    }
  };

  // Handle image selection
  const handleImageSelect = (path: string) => {
    setValue('background_path', path);
    // Don't save immediately, let the user save with the Save Changes button
  };

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setValue('color', color);
    // Don't save immediately, let the user save with the Save Changes button
  };

  // Construct the image URL for preview
  const imageUrl = backgroundPath
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/features_images/${backgroundPath}`
    : 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop';

  return (
    <Form {...form}>
      <div className="space-y-2">
        {/* Edit Buttons - Moved outside the card */}
        <div className="flex justify-end gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={() => setShowImagePicker(true)}>
            <ImageIcon className="h-3.5 w-3.5 mr-1" />
            {backgroundPath ? 'Change Background' : 'Add Background'}
          </Button>

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ColorPicker
                    value={field.value || '#000000'}
                    onChange={(value) => {
                      field.onChange(value);
                      handleColorSelect(value);
                    }}
                  >
                    {field.value ? 'Change Color' : 'Add Color'}
                  </ColorPicker>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="relative h-72 w-full overflow-hidden rounded-xl group">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img src={imageUrl} alt={title || ''} className="h-full w-full object-cover" />
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  {editingField === 'title' ? (
                    <div className="flex items-center gap-2 mb-1">
                      <FormControl>
                        <Input
                          {...field}
                          autoFocus
                          onKeyDown={(e) => handleKeyDown(e, 'title')}
                          className="bg-black/50 text-white border-white/30 focus-visible:ring-white/30"
                        />
                      </FormControl>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSave('title')}
                        className="text-white"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <FormMessage />
                    </div>
                  ) : (
                    <h3
                      className="text-xl font-bold text-white cursor-pointer flex items-center group/title"
                      onClick={() => setEditingField('title')}
                    >
                      {title || 'Add title...'}
                      <Pencil className="h-3 w-3 ml-2 opacity-0 group-hover/title:opacity-100" />
                    </h3>
                  )}
                </FormItem>
              )}
            />

            {/* Subtitle */}
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  {editingField === 'subtitle' ? (
                    <div className="flex items-center gap-2 mb-1">
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          autoFocus
                          onKeyDown={(e) => handleKeyDown(e, 'subtitle')}
                          className="bg-black/50 text-white border-white/30 focus-visible:ring-white/30"
                        />
                      </FormControl>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSave('subtitle')}
                        className="text-white"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <FormMessage />
                    </div>
                  ) : (
                    <p
                      className="text-white/90 mt-1 cursor-pointer flex items-center group/subtitle"
                      onClick={() => setEditingField('subtitle')}
                    >
                      {subtitle || 'Add subtitle...'}
                      <Pencil className="h-3 w-3 ml-2 opacity-0 group-hover/subtitle:opacity-100" />
                    </p>
                  )}
                </FormItem>
              )}
            />

            {/* Link Button */}
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  {editingField === 'link' ? (
                    <div className="flex items-center gap-2 mt-3">
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          autoFocus
                          placeholder="https://example.com"
                          onKeyDown={(e) => handleKeyDown(e, 'link')}
                          className="bg-black/50 text-white border-white/30 focus-visible:ring-white/30"
                        />
                      </FormControl>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSave('link')}
                        className="text-white"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <FormMessage />
                    </div>
                  ) : (
                    <div
                      className="mt-3 inline-flex items-center text-sm font-medium text-primary-foreground cursor-pointer group/link"
                      onClick={() => setEditingField('link')}
                    >
                      {link ? (
                        <>
                          Learn more
                          <ExternalLink className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Add link
                          <Pencil className="h-3 w-3 ml-2" />
                        </>
                      )}
                    </div>
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Image Picker Dialog */}
          <ImagePicker
            open={showImagePicker}
            onClose={() => setShowImagePicker(false)}
            onSelect={handleImageSelect}
            bucketName="features_images"
            currentPath={backgroundPath || undefined}
          />

          {/* Image Picker Dialog Only - Color picker is now in a Popover */}
        </div>

        {/* Save Changes Button */}
        <div className="mt-4 flex justify-end">
          <Button
            disabled={!formState.isDirty}
            onClick={() => {
              const formValues = form.getValues();
              onUpdate(formValues);
              form.reset(formValues);
            }}
            className="gap-2 w-full"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </Form>
  );
}
