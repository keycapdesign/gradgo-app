import { useState } from 'react';
import { useCSVParser } from '@/hooks/use-csv-parser.client';
import { createClient } from '@/utils/supabase/client';
import { AlertCircle, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { formatBytes } from '@/components/dropzone';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface GownCompositionUploadProps {
  eventId: number;
}

export function GownCompositionUpload({ eventId }: GownCompositionUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const {
    file,
    parsedData,
    isLoading,
    error,
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    reset,
  } = useCSVParser({
    onParsed: (data) => {
      // Use the file name as the default mapping name if not already set
      if (!name && data.fileName) {
        setName(data.fileName.replace(/\.[^/.]+$/, ''));
      }

      // Log the parsed data for debugging
      console.log('Parsed data:', {
        fileName: data.fileName,
        headers: data.headers,
        rowCount: data.rows.length,
        firstRow: data.rows[0],
      });
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      reset();
      setName('');
      setDescription('');
      setUploadSuccess(false);
    }, 300);
  };

  const handleUpload = async () => {
    if (!parsedData || !file) return;

    setIsProcessing(true);

    try {
      // Convert parsed data to CSV format
      let csvContent = '';

      // Add headers
      csvContent += parsedData.headers.join(',') + '\n';

      // Add rows
      parsedData.rows.forEach((row) => {
        const rowValues = parsedData.headers.map((header) => {
          const value = row[header];
          // Handle values with commas by wrapping in quotes
          if (value && value.includes(',')) {
            return `"${value}"`;
          }
          return value || '';
        });
        csvContent += rowValues.join(',') + '\n';
      });

      // Log the CSV content for debugging
      console.log('CSV Headers:', parsedData.headers);
      console.log('First few rows:', parsedData.rows.slice(0, 3));

      // Validate expected headers
      const expectedHeaders = ['parent_ean', 'hood', 'cap', 'bonnet', 'gown'];
      const missingHeaders = expectedHeaders.filter(
        (header) => !parsedData.headers.includes(header)
      );

      if (missingHeaders.length > 0) {
        console.warn('Missing expected headers:', missingHeaders);
        // Try to map headers if they're different but have similar meaning
        // For example, if the CSV has 'parent' instead of 'parent_ean'
        const headerMap: Record<string, string> = {};

        // Look for similar headers
        expectedHeaders.forEach((expected) => {
          if (!parsedData.headers.includes(expected)) {
            // Try to find a similar header
            const similar = parsedData.headers.find(
              (h) => h.includes(expected.replace('_', '')) || expected.includes(h)
            );
            if (similar) {
              headerMap[similar] = expected;
              console.log(`Mapping '${similar}' to '${expected}'`);
            }
          }
        });

        // If we found mappings, transform the data
        if (Object.keys(headerMap).length > 0) {
          // Transform headers
          parsedData.headers = parsedData.headers.map((h) => headerMap[h] || h);

          // Transform row data
          parsedData.rows = parsedData.rows.map((row) => {
            const newRow: Record<string, any> = {};
            Object.keys(row).forEach((key) => {
              const newKey = headerMap[key] || key;
              newRow[newKey] = row[key];
            });
            return newRow;
          });

          console.log('Transformed headers:', parsedData.headers);
          console.log('Transformed first row:', parsedData.rows[0]);
        }
      }

      // Call the RPC function to process the CSV
      const supabase = createClient();
      console.log('Calling RPC with event ID:', eventId);

      // First, create a new composition set
      const { data: compositionSet, error: compositionSetError } = await supabase
        .from('gown_composition_sets')
        .insert({
          name: name,
          description: description,
          event_id: eventId,
          is_active: true,
        })
        .select()
        .single();

      if (compositionSetError) {
        console.error('Error creating composition set:', compositionSetError);
        throw new Error(compositionSetError.message);
      }

      console.log('Created composition set:', compositionSet);

      // Now process each row of the CSV and insert into gown_compositions
      const composition_set_id = compositionSet.id;
      let linesProcessed = 0;
      const errors: string[] = [];

      // Additional logging for debugging
      console.log('Processing CSV with headers:', parsedData.headers);
      console.log('First row to process:', parsedData.rows[0]);

      // Skip the header row (already handled)
      for (let i = 0; i < parsedData.rows.length; i++) {
        const row = parsedData.rows[i];
        try {
          // Make sure we have the required fields
          if (!row.parent_ean) {
            console.error(`Row ${i}: Missing parent_ean`);
            errors.push(`Row ${i}: Missing parent_ean`);
            continue;
          }

          // Insert the composition directly
          const { error: insertError } = await supabase.from('gown_compositions').insert({
            composition_set_id: composition_set_id,
            parent_ean: row.parent_ean,
            hood: row.hood || null,
            cap: row.cap || null,
            bonnet: row.bonnet || null,
            gown: row.gown || null,
          });

          if (insertError) {
            console.error(`Error inserting row ${i}:`, insertError);
            errors.push(`Row ${i}: ${insertError.message}`);
          } else {
            linesProcessed++;
          }
        } catch (err) {
          console.error(`Error processing row ${i}:`, err);
          errors.push(`Row ${i}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Create a response object similar to what the RPC would return
      const data = {
        success: linesProcessed > 0,
        mapping_set_id: composition_set_id, // Use the composition_set_id
        lines_processed: linesProcessed,
        errors: errors,
      };

      // No error at this point since we're handling errors per row

      console.log('RPC response:', data);

      if (data && data.success) {
        setUploadSuccess(true);
        toast.success('Composition set uploaded successfully', {
          description: `Processed ${data.lines_processed} lines from the CSV file.`,
        });

        // The composition set is already active since we set is_active=true when creating it
        // But we'll make sure all other composition sets for this event are inactive
        const { error: updateError } = await supabase
          .from('gown_composition_sets')
          .update({ is_active: false })
          .eq('event_id', eventId)
          .neq('id', data.mapping_set_id);

        if (updateError) {
          console.warn('Error updating other composition sets:', updateError);
          // Continue anyway since the upload was successful
        }
      } else {
        console.error('RPC returned success: false or undefined data');
        throw new Error('Failed to process CSV file');
      }
    } catch (err) {
      console.error('Error uploading composition set:', err);
      toast.error('Upload failed', {
        description: err instanceof Error ? err.message : 'An unknown error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Gown Composition</CardTitle>
        <CardDescription>
          Upload a CSV file with gown compositions to enable detailed gown statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="gap-2 w-full">
              <FileSpreadsheet className="h-4 w-4" />
              Upload CSV File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md md:max-w-2xl w-[90vw]">
            <DialogHeader>
              <DialogTitle>Upload Gown Composition</DialogTitle>
              <DialogDescription>
                Upload a CSV file with gown compositions to enable detailed gown statistics
              </DialogDescription>
            </DialogHeader>

            {uploadSuccess ? (
              <div className="space-y-4 py-4">
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                  <AlertTitle>Upload Complete</AlertTitle>
                  <AlertDescription>
                    Your gown composition set has been successfully uploaded and activated.
                  </AlertDescription>
                </Alert>

                <DialogFooter>
                  <Button onClick={handleClose}>Close</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Set Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Spring 2024 Gowns"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Additional details about this composition set"
                      rows={2}
                    />
                  </div>
                </div>

                <div
                  {...getRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300',
                    isDragActive && 'border-primary bg-primary/10',
                    isDragReject && 'border-destructive bg-destructive/10',
                    error && 'border-destructive'
                  )}
                >
                  <input {...getInputProps()} />

                  {file ? (
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                        <FileSpreadsheet size={18} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          reset();
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-y-2">
                      <Upload size={20} className="text-muted-foreground" />
                      <p className="text-sm">Upload CSV file</p>
                      <p className="text-xs text-muted-foreground">
                        Drag and drop or{' '}
                        <span className="underline cursor-pointer transition hover:text-foreground">
                          select file
                        </span>{' '}
                        to upload
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isLoading && (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    CSV Format: The file should have the following columns:
                  </p>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                    parent_ean,hood,cap,bonnet,gown
                  </pre>
                  <p className="text-xs text-muted-foreground mt-2">
                    Example: HIRE-01-ARU-SET-FND-42-L,01-ARU-HD-UGM,GA-FMB-NAV-L,,GA-GWN-B2-42
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={isProcessing || !file || !name || !parsedData}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Composition Set'
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground mb-2">
            CSV Format: The file should have the following columns:
          </p>
          <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
            parent_ean,hood,cap,bonnet,gown
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Example: HIRE-01-ARU-SET-FND-42-L,01-ARU-HD-UGM,GA-FMB-NAV-L,,GA-GWN-B2-42
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
