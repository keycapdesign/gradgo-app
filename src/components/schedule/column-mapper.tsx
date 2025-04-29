import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface ColumnMapperProps {
  headers: string[]
  rows: Record<string, string>[]
  onSubmit: (mapping: Record<string, string>) => Promise<void>
  isProcessing?: boolean
}

// The fields we need to map to
const REQUIRED_FIELDS = {
  title: 'Title',
  timestamp: 'Date & Time',
}

const OPTIONAL_FIELDS = {
  description: 'Description',
}

export function ColumnMapper({ headers, rows, onSubmit, isProcessing = false }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([])

  // Initialize preview data with first few rows
  useEffect(() => {
    setPreviewData(rows.slice(0, 3))
  }, [rows])

  // Handle mapping change
  const handleMappingChange = (field: string, header: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: header === '__none__' ? '' : header
    }))
  }

  // Check if all required fields are mapped
  const isReadyToSubmit = Object.keys(REQUIRED_FIELDS).every(field => mapping[field])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Map Columns</h3>
        <p className="text-sm text-muted-foreground">
          Match the columns from your file to the schedule item fields.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Required fields */}
          {Object.entries(REQUIRED_FIELDS).map(([field, label]) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                {label} <span className="text-destructive ml-1">*</span>
              </label>
              <Select
                value={mapping[field] || undefined}
                onValueChange={(value) => handleMappingChange(field, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${label} column`} />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          {/* Optional fields */}
          {Object.entries(OPTIONAL_FIELDS).map(([field, label]) => (
            <div key={field} className="space-y-2">
              <label className="text-sm font-medium">{label}</label>
              <Select
                value={mapping[field] || '__none__'}
                onValueChange={(value) => handleMappingChange(field, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${label} column (optional)`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* Preview table */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Preview</h3>
        <div className="border rounded-md overflow-auto max-h-60 max-w-full">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxWidth: '150px' }}>
                    <div className="truncate">
                      {header}
                      {Object.entries(mapping).map(([field, mappedHeader]) =>
                        mappedHeader === header ? (
                          <span key={field} className="ml-2 text-xs text-primary">
                            ({field})
                          </span>
                        ) : null
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow key={index}>
                  {headers.map((header) => (
                    <TableCell key={`${index}-${header}`} className="whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxWidth: '150px' }}>
                      <div className="truncate" title={row[header] || ''}>
                        {row[header]}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing preview of first {previewData.length} rows out of {rows.length} total rows.
        </p>
      </div>

      {/* Submit button */}
      <Button
        onClick={() => onSubmit(mapping)}
        disabled={!isReadyToSubmit || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Import ${rows.length} Schedule Items`
        )}
      </Button>
    </div>
  )
}
