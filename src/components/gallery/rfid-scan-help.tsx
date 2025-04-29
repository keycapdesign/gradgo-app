import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface RfidScanHelpProps {
  onBack: () => void
}

export function RfidScanHelp({ onBack }: RfidScanHelpProps) {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Where to Scan</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mb-4">
          <p className="text-lg">The RFID tag is located inside the gown label.</p>
          {/* Replace this with your actual image */}
          <div className="bg-muted h-64 w-full rounded-md flex items-center justify-center mt-4">
            <p className="text-muted-foreground">Gown RFID Location Image</p>
          </div>
          <p className="mt-4 text-base text-muted-foreground">
            Hold the scanner close to the label to scan the RFID tag.
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button
          onClick={onBack}
          size="lg"
          className="h-12 px-6 text-lg"
        >
          Back to Scanning
        </Button>
      </CardFooter>
    </Card>
  )
}
