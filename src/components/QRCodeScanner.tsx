import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Camera, X } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRCodeScanner = ({ onScan, onClose }: QRCodeScannerProps) => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  useEffect(() => {
    // Initialize scanner
    scannerRef.current = new Html5Qrcode(scannerContainerId);

    // Cleanup on unmount
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current
          .stop()
          .catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, []);

  const startScanner = async () => {
    setError(null);
    setIsScanning(true);

    try {
      await scannerRef.current?.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // On successful scan
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore the QR code not found error
          if (!errorMessage.includes('QR code not found')) {
            console.error('QR Scan error:', errorMessage);
          }
        }
      );
    } catch (err: any) {
      setIsScanning(false);
      setError(err.message || t('cameraAccessError'));
      console.error('Error starting scanner:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div id={scannerContainerId} className="w-full max-w-sm h-64 relative">
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Camera className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-center text-gray-500 dark:text-gray-400 mb-4">
              {t('scanQrCodeInstructions')}
            </p>
            <Button onClick={startScanner} className="mt-2">
              {t('startScanner')}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-between w-full mt-4">
        {isScanning && (
          <Button variant="outline" onClick={stopScanner} className="mr-2">
            {t('stopScanner')}
          </Button>
        )}
        <Button variant="ghost" onClick={onClose} className="flex items-center">
          <X className="h-4 w-4 mr-2" />
          {t('close')}
        </Button>
      </div>
    </div>
  );
};

export default QRCodeScanner;
