import { useState, useRef, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { QrCode, Camera } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import '@/styles/html5-qr-scanner.css'

interface QrScannerProps {
  onScan: (data: { bookingId: number }) => void
  buttonText?: string
  dialogTitle?: string
}

export function QrScanner({ onScan, buttonText = 'Scan QR Code', dialogTitle = 'Scan QR Code' }: QrScannerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Removed unused state: const [cameraActive, setCameraActive] = useState(false)
  const [scannerInitialized, setScannerInitialized] = useState(false)

  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  // Initialize scanner when dialog opens
  useEffect(() => {
    // Set mounted ref to true when component mounts
    mountedRef.current = true;

    // Clean up when component unmounts
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  // Handle dialog open/close
  useEffect(() => {
    let initTimeoutId: ReturnType<typeof setTimeout>;

    if (isOpen && !scannerInitialized) {
      // Add a delay before initializing the scanner
      // This helps ensure the DOM is ready
      initTimeoutId = setTimeout(() => {
        if (mountedRef.current) {
          initScanner();
        }
      }, 500);
    } else if (!isOpen) {
      stopScanner();
    }

    return () => {
      clearTimeout(initTimeoutId);
    };
  }, [isOpen, scannerInitialized]);

  const initScanner = async () => {
    try {
      // Clean up any existing scanner
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }

      // Make sure the container exists
      if (!containerRef.current) {
        console.error('Scanner container not found');
        return;
      }

      // Create a unique ID for the scanner
      const scannerId = 'qr-reader-' + Date.now();

      // Create the scanner element
      const scannerElement = document.createElement('div');
      scannerElement.id = scannerId;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(scannerElement);

      console.log('Creating scanner with ID:', scannerId);

      // Create scanner instance
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        // Prefer back camera
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );

        const cameraId = backCamera ? backCamera.id : devices[0].id;

        // Start scanning
        await startScanner(cameraId);

        setScannerInitialized(true);
        console.log('Scanner initialized with camera:', cameraId);
      } else {
        setError('No cameras found on this device');
      }
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('Error initializing scanner. Please try again.');
    }
  };

  const startScanner = async (cameraId: string) => {
    if (!scannerRef.current) return;

    try {
      setError(null);

      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 }, // Larger QR box
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        cameraId,
        config,
        handleScan,
        handleScanError
      );

      // setCameraActive(true);
      console.log('Scanner started successfully');
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Error starting scanner. Please make sure you have granted camera permissions.');
      // setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        console.log('Scanner stopped');
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }

    // setCameraActive(false);
    setIsScanning(false);
    setScannerInitialized(false);

    // Clear the container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  };

  const restartScanner = async () => {
    await stopScanner();

    // Add a small delay before restarting
    setTimeout(() => {
      if (mountedRef.current && isOpen) {
        initScanner();
      }
    }, 300);
  };

  const handleScan = (decodedText: string) => {
    try {
      // Prevent duplicate scans within a short time period
      if (isScanning || decodedText === lastScannedCode) {
        return;
      }

      console.log('QR code scanned:', decodedText);

      // Set this as the last scanned code
      setLastScannedCode(decodedText);

      // Parse the QR code data
      const parsedData = JSON.parse(decodedText);

      // Check if the data contains a bookingId
      if (parsedData && parsedData.bookingId) {
        // Show success feedback briefly before closing
        setIsScanning(true);

        // Clear any existing timeout
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
        }

        // Set a new timeout
        scanTimeoutRef.current = setTimeout(() => {
          // Process the scan
          onScan(parsedData);
          // Close the dialog
          setIsOpen(false);
          // Reset states
          setIsScanning(false);
          setLastScannedCode(null);
          scanTimeoutRef.current = null;
        }, 500); // Short delay to show success animation
      } else {
        setError('Invalid QR code format. No booking ID found.');
        // Reset last scanned code after a delay
        setTimeout(() => setLastScannedCode(null), 2000);
      }
    } catch (err) {
      console.error('Error parsing QR code data:', err);
      setError('Failed to parse QR code data.');
      // Reset last scanned code after a delay
      setTimeout(() => setLastScannedCode(null), 2000);
    }
  };

  const handleScanError = (err: string | Error) => {
    const errorMessage = typeof err === 'string' ? err : err.message || 'Unknown error';

    if (errorMessage.includes('No barcode or QR code detected.') || errorMessage.includes('No MultiFormat Readers were able to detect the code.')) {
      // This is normal during scanning, don't show an error
      return;
    }

    console.error('Scan error:', err);
    setError('Error scanning QR code. Please try again.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setError(null);
        setIsScanning(false);
        // setCameraActive(false);
        setLastScannedCode(null);

        // Clear any existing timeout
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
          scanTimeoutRef.current = null;
        }
      } else {
        console.log('Dialog opened, initializing scanner...');
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg h-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center overflow-hidden justify-center gap-4">
          {error && (
            <div className="text-destructive text-sm mb-2">{error}</div>
          )}

          <div className="relative w-full max-w-full h-120 mx-auto overflow-hidden rounded-lg aspect-video bg-black">
            {/* Success overlay */}
            {isScanning && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="px-4 py-2 rounded-full text-sm font-medium bg-green-500/90 text-white">
                  QR Code Found!
                </div>
              </div>
            )}

            {/* Camera status indicator */}
            {/* {cameraActive && (
              <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Camera active
              </div>
            )} */}

            {/* Scanner container */}
            <div
              ref={containerRef}
              className="w-full h-120"
              style={{ position: 'relative' }}
            ></div>
          </div>

          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={restartScanner}
            >
              <Camera className="h-4 w-4" />
              Restart Scanner
            </Button>

            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Position the QR code from the student's confirmation email within the frame.
            The scanner will automatically detect valid QR codes.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
