import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';
import QRCodeScanner from './QRCodeScanner';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';
import { setBoulderValidated } from '@/lib/database';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationData {
  type: string;
  userId: string;
  boulderId: string;
  boulderName: string;
  boulderColor: string;
  attemptCount: number;
  timestamp: string;
  requestId: string;
  climberName: string;
}

const QRScannerModal = ({ isOpen, onClose }: QRScannerModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationData, setValidationData] = useState<ValidationData | null>(null);

  const handleScan = async (qrToken: string) => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      // First, verify the QR token
      const { data: requestData, error: requestError } = await supabase
        .from('validation_requests')
        .select(`
          id,
          climber_id,
          boulder_id,
          status,
          attempt_count,
          created_at,
          profiles!validation_requests_climber_id_fkey(name),
          boulders(name, color)
        `)
        .eq('qr_token', qrToken)
        .eq('status', 'pending')
        .single();

      if (requestError) throw new Error(t('invalidQrCode'));

      if (!requestData) {
        throw new Error(t('invalidOrExpiredQrCode'));
      }

      // Update the validation request with the validator's ID
      const { error: updateError } = await supabase
        .from('validation_requests')
        .update({
          validator_id: session.user.id,
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestData.id);

      if (updateError) throw updateError;

      // First check if an attempt record already exists
      const { data: existingAttempt, error: checkError } = await supabase
        .from('attempts')
        .select('id')
        .eq('userId', requestData.climber_id)
        .eq('boulderId', requestData.boulder_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingAttempt) {
        // Update the existing attempt record
        console.log('Updating existing attempt record:', existingAttempt.id);
        const { error: updateError } = await supabase
          .from('attempts')
          .update({
            sendattempts: requestData.attempt_count,
            status: 'sent',
            timestamp: new Date().toISOString(),
            validated: true // Mark as validated
          })
          .eq('id', existingAttempt.id);

        if (updateError) throw updateError;
      } else {
        // Create a new attempt record
        console.log('Creating new attempt record');
        // Generate a unique ID for the new record
        const attemptId = `${requestData.climber_id}_${requestData.boulder_id}_${Date.now()}`;

        const { error: insertError } = await supabase
          .from('attempts')
          .insert({
            id: attemptId,
            userId: requestData.climber_id,
            boulderId: requestData.boulder_id,
            sendattempts: requestData.attempt_count,
            zoneattempts: 0, // Default to 0 for zone attempts
            status: 'sent',
            timestamp: new Date().toISOString(),
            validated: true // Mark as validated
          });

        if (insertError) throw insertError;
      }

      // Directly set the validated status using our dedicated function
      // This is a backup to ensure the validated flag is set
      const validationResult = await setBoulderValidated(requestData.climber_id, requestData.boulder_id, true);
      console.log('Direct validation result:', validationResult);


      // Format validation data for display
      const validationInfo: ValidationData = {
        type: 'boulder_validation',
        userId: requestData.climber_id,
        boulderId: requestData.boulder_id,
        boulderName: requestData.boulders?.name || 'Unknown Boulder',
        boulderColor: requestData.boulders?.color || 'Unknown Color',
        attemptCount: requestData.attempt_count,
        timestamp: requestData.created_at,
        requestId: requestData.id,
        climberName: requestData.profiles?.name || 'Unknown Climber'
      };

      setValidationData(validationInfo);
      setSuccess(true);

      toast({
        title: t('validationSuccess'),
        description: t('climbValidated'),
      });
    } catch (error: any) {
      console.error('Error validating QR code:', error);
      toast({
        title: t('error'),
        description: error.message || t('errorValidatingQrCode'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setValidationData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('scanQrCode')}</DialogTitle>
          <DialogDescription>
            {success ? t('validationSuccessful') : t('scanQrCodeToValidate')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>{t('validating')}</p>
            </div>
          ) : success && validationData ? (
            <div className="flex flex-col items-center">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg w-full mb-4">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {t('validationSuccessful')}
                  </h3>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-medium">{t('climber')}:</span> {validationData.climberName}
                  </div>
                  <div>
                    <span className="font-medium">{t('boulder')}:</span> {validationData.boulderName}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">{t('color')}:</span>
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: validationData.boulderColor }}
                    />
                    {validationData.boulderColor}
                  </div>
                  <div>
                    <span className="font-medium">{t('attempts')}:</span> {validationData.attemptCount}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <QRCodeScanner onScan={handleScan} onClose={handleClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerModal;
