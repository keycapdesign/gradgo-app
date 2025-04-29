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

interface GownMappingUploadProps {
  eventId: number;
}

export function GownMappingUpload({ eventId }: GownMappingUploadProps) {
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

      // Call the RPC function to process the CSV
      const supabase = createClient();
      const { data, error } = await supabase.rpc('process_gown_mapping_csv', {
        p_event_id: eventId,
        p_name: name,
        p_description: description,
        p_csv_data: csvContent,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setUploadSuccess(true);
        toast.success('Mapping uploaded successfully', {
          description: `Processed ${data.lines_processed} lines from the CSV file.`,
        });

        // Set this mapping as active
        await supabase.rpc('set_active_gown_mapping_set', {
          p_mapping_set_id: data.mapping_set_id,
        });
      } else {
        throw new Error('Failed to process CSV file');
      }
    } catch (err) {
      console.error('Error uploading mapping:', err);
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
        <CardTitle>Upload Gown Mapping</CardTitle>
        <CardDescription>
          Upload a CSV file with gown EAN mappings to enable detailed gown statistics
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
              <DialogTitle>Upload Gown Mapping</DialogTitle>
              <DialogDescription>
                Upload a CSV file with gown EAN mappings to enable detailed gown statistics
              </DialogDescription>
            </DialogHeader>

            {uploadSuccess ? (
              <div className="space-y-4 py-4">
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                  <AlertTitle>Upload Complete</AlertTitle>
                  <AlertDescription>
                    Your gown mapping has been successfully uploaded and activated.
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
                    <Label htmlFor="name">Mapping Name</Label>
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
                      placeholder="Additional details about this mapping"
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
                    'Upload Mapping'
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
