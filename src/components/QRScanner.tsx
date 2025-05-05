import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;    // Called with decoded text from the QR
  onClose: () => void;              // Closes the scanner
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const { t } = useTranslation();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-code-scanner';

  useEffect(() => {
    try {
      scannerRef.current = new Html5Qrcode(scannerContainerId);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        // Only scan for QR codes
      };

      // Start the scanner
      console.log('Starting QR scanner...');
      scannerRef.current
        .start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            console.log('QR Code detected:', decodedText);

            // Validate the QR code format before processing
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(decodedText)) {
              console.log('Valid UUID format detected');

              // Pass the data to the parent component
              onScan(decodedText);

              // Stop scanning after a successful read
              try {
                console.log('Stopping scanner after successful scan');
                const stopPromise = scannerRef.current?.stop();
                stopPromise?.catch((err) => console.error('Error stopping scanner', err));
              } catch (err) {
                console.error('Error stopping scanner', err);
              }
            } else {
              console.log('Non-UUID format detected, attempting to parse as JSON');
              try {
                // Try to parse as JSON
                const jsonData = JSON.parse(decodedText);
                console.log('Successfully parsed as JSON:', jsonData);

                // Pass the data to the parent component
                onScan(decodedText);

                // Stop scanning after a successful read
                try {
                  console.log('Stopping scanner after successful scan');
                  const stopPromise = scannerRef.current?.stop();
                  stopPromise?.catch((err) => console.error('Error stopping scanner', err));
                } catch (err) {
                  console.error('Error stopping scanner', err);
                }
              } catch (err) {
                console.error('Failed to parse as JSON:', err);
                // Don't stop scanning, let the user try again
              }
            }
          },
          (errorMessage) => {
            // Called frequently during scanning if there's no QR found
            if (!errorMessage.includes('QR code not found')) {
              console.debug('Scanning error', errorMessage);
            }
          }
        )
        .catch((err) => {
          console.error('Error starting scanner', err);
        });
    } catch (error) {
      console.error('Error initializing scanner:', error);
    }

    // Cleanup on component unmount
    return () => {
      try {
        const stopPromise = scannerRef.current?.stop();
        stopPromise?.catch((err) => console.error('Error stopping scanner', err));
      } catch (err) {
        console.error('Error stopping scanner', err);
      }
    };
  }, [onScan]);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t('scanQrCode')}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative rounded-lg overflow-hidden bg-black">
          {/* Scanner container */}
          <div
            id={scannerContainerId}
            className="w-full h-[300px]"
          />

          {/* Scanning overlay */}
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary/50" />
        </div>

        <p className="mt-4 text-sm text-muted-foreground text-center">
          {t('positionQrCodeInFrame')}
        </p>
      </CardContent>
    </Card>
  );
};

export default QRScanner;