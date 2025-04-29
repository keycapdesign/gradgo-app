import { useState } from 'react';
import { useCSVParser } from '@/hooks/use-csv-parser.client';
import { processScheduleItem } from '@/utils/ai/process-schedule-item.server';
import { AlertCircle, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';

import { formatBytes } from '@/components/dropzone';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ColumnMapper } from './column-mapper';

interface ScheduleImportProps {
  eventId: number;
  onImportComplete: () => void;
  onError?: (error: string) => void;
}

export function ScheduleImport({ eventId, onImportComplete, onError }: ScheduleImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'map'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

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
    onParsed: () => {
      setStep('map');
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      reset();
      setStep('upload');
      setImportStats(null);
    }, 300);
  };

  const handleImport = async (mapping: Record<string, string>) => {
    if (!parsedData) return;

    setIsProcessing(true);

    try {
      const { rows } = parsedData;
      const stats = {
        total: rows.length,
        success: 0,
        failed: 0,
      };

      // Get the Supabase client
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      // Process each row
      for (const row of rows) {
        try {
          // Extract data based on mapping
          const title = mapping.title ? row[mapping.title] : null;
          const description =
            mapping.description && mapping.description !== '' && mapping.description !== '__none__'
              ? row[mapping.description]
              : null;
          let timestamp = mapping.timestamp ? row[mapping.timestamp] : null;

          // If timestamp is provided but needs processing (natural language)
          if (title && !timestamp) {
            // Try to process the title as natural language
            try {
              const processedItem = await processScheduleItem({ data: { input: title } });
              timestamp = processedItem.timestamp;
            } catch (err) {
              console.error('Error processing natural language:', err);
            }
          }

          // Insert into database
          const { error } = await supabase.from('schedule_items').insert({
            title,
            description,
            timestamp,
            event_id: eventId,
          });

          if (error) {
            throw error;
          }

          stats.success++;
        } catch (err) {
          console.error('Error importing row:', err);
          stats.failed++;
        }
      }

      setImportStats(stats);

      // If at least one item was successfully imported, call the onImportComplete callback
      if (stats.success > 0) {
        onImportComplete();
      }
    } catch (err) {
      console.error('Error during import:', err);
      if (onError) {
        onError('Failed to import schedule items');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Import Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-2xl w-[90vw]">
        {step === 'upload' && (
          <DialogHeader>
            <DialogTitle>Import Schedule Items</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to bulk import schedule items.
            </DialogDescription>
          </DialogHeader>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
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
                  <p className="text-sm">Upload CSV or Excel file</p>
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

            {file && !error && !isLoading && (
              <Button className="w-full" onClick={() => setStep('map')} disabled={!parsedData}>
                Continue to Column Mapping
              </Button>
            )}
          </div>
        )}

        {step === 'map' && parsedData && (
          <>
            {importStats ? (
              <div className="space-y-4 py-4">
                <Alert
                  variant={importStats.failed > 0 ? 'destructive' : 'default'}
                  className={
                    importStats.failed > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''
                  }
                >
                  <AlertTitle>Import Complete</AlertTitle>
                  <AlertDescription>
                    Successfully imported {importStats.success} of {importStats.total} schedule
                    items.
                    {importStats.failed > 0 && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {importStats.failed} items failed to import. Check the console for details.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>

                <DialogFooter>
                  <Button onClick={handleClose}>Close</Button>
                </DialogFooter>
              </div>
            ) : (
              <ColumnMapper
                headers={parsedData.headers}
                rows={parsedData.rows}
                onSubmit={handleImport}
                isProcessing={isProcessing}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
