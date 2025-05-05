import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

interface QRCodeGeneratorProps {
  data: string;
  size?: number;
  title?: string;
}

const QRCodeGenerator = ({ data, size = 200, title }: QRCodeGeneratorProps) => {
  const { t } = useTranslation();

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="flex flex-col items-center justify-center p-6">
        {title && (
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
        )}
        <div className="bg-white p-4 rounded-lg">
          <QRCode
            value={data}
            size={size}
            level="H" 
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground text-center">
          {t('scanQrCodeToValidate')}
        </p>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
