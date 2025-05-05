import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';
import QRCodeGenerator from './QRCodeGenerator';
import { Boulder } from '@/types';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';

// Helper function to capitalize the first letter of a string
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

interface ValidationQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  boulder: Boulder;
  attemptCount: number;
  userId: string;
}

const ValidationQRModal = ({
  isOpen,
  onClose,
  boulder,
  attemptCount,
  userId
}: ValidationQRModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [qrData, setQrData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Generate QR data when the modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(false);
      generateQRData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, boulder.id, userId, attemptCount]);

  // Function to regenerate the QR code
  const regenerateQRCode = async () => {
    setRegenerating(true);
    setError(false);

    try {
      console.log('Regenerating QR code for boulder:', boulder.id, 'user:', userId);

      // Check if there's an existing request
      const { data: existingRequest, error: fetchError } = await supabase
        .from('validation_requests')
        .select('id')
        .eq('climber_id', userId)
        .eq('boulder_id', String(boulder.id))
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing request:', fetchError);
      }

      if (existingRequest) {
        console.log('Found existing request, deleting:', existingRequest.id);
        // Delete the existing request
        const { error: deleteError } = await supabase
          .from('validation_requests')
          .delete()
          .eq('id', existingRequest.id);

        if (deleteError) {
          console.error('Error deleting existing request:', deleteError);
        }
      } else {
        console.log('No existing request found to delete');
      }

      // Generate a new QR code
      const qrToken = uuidv4();
      console.log('Generated new QR token:', qrToken);

      // Ensure boulder_id is a string
      const boulderId = String(boulder.id);
      console.log('Boulder ID for regenerated validation request:', boulderId);

      // Create a new validation request with the QR token
      const { data: newRequest, error } = await supabase
        .from('validation_requests')
        .insert({
          climber_id: userId,
          boulder_id: boulderId,
          status: 'pending',
          attempt_count: attemptCount,
          qr_token: qrToken,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('Created regenerated validation request:', newRequest);

      if (error) {
        console.error('Error creating new validation request:', error);
        throw error;
      }

      console.log('Created new validation request:', newRequest);

      // Set the QR token to be displayed
      setQrData(qrToken);

      toast({
        title: t('qrCodeRegenerated'),
        description: t('newQrCodeGenerated'),
      });
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      setError(true);
      toast({
        title: t('error'),
        description: t('errorRegeneratingQrCode'),
        variant: 'destructive'
      });
    } finally {
      setRegenerating(false);
    }
  };

  // Create validation data to encode in QR code directly using Supabase
  async function generateQRData() {
    try {
      console.log('Generating QR data for boulder:', boulder.id, 'user:', userId, 'attempts:', attemptCount);

      // Check if there's already a pending request for this climber and boulder
      const { data: existingRequest, error: fetchError } = await supabase
        .from('validation_requests')
        .select('id, qr_token')
        .eq('climber_id', userId)
        .eq('boulder_id', String(boulder.id))
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing requests:', fetchError);
        throw fetchError;
      }

      // If there's an existing request with a QR token, use that
      if (existingRequest && existingRequest.qr_token) {
        console.log('Using existing QR token:', existingRequest.qr_token);
        setQrData(existingRequest.qr_token);
        return;
      }

      console.log('No existing request found, creating new one');

      // Generate a unique QR token using UUID
      const qrToken = uuidv4();
      console.log('Generated new QR token:', qrToken);

      // Ensure boulder_id is a string
      const boulderId = String(boulder.id);
      console.log('Boulder ID for validation request:', boulderId);

      // Create a new validation request with the QR token
      const { data: newRequest, error } = await supabase
        .from('validation_requests')
        .insert({
          climber_id: userId,
          boulder_id: boulderId,
          status: 'pending',
          attempt_count: attemptCount,
          qr_token: qrToken,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      console.log('Created validation request:', newRequest);

      if (error) {
        console.error('Error creating validation request:', error);
        throw error;
      }

      console.log('Created new validation request:', newRequest);

      // Set the QR token to be displayed
      setQrData(qrToken);
    } catch (error: unknown) {
      console.error('Error generating QR code:', error);
      setError(true);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('errorGeneratingQrCode'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('validationRequest')}</DialogTitle>
          <DialogDescription>
            {t('showQrCodeToValidator')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: boulder.color }} />
            <span className="font-medium">{boulder.name}</span>
            <span className="text-sm text-muted-foreground ml-auto">
              {t('attempts')}: {attemptCount}
            </span>
          </div>
          <div className="mb-4 text-center">
            <span className="text-sm text-muted-foreground">
              {t('color')}: {capitalizeFirstLetter(boulder.color)}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-[250px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center p-4 border rounded-md bg-red-50 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">{t('errorGeneratingQrCode')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <QRCodeGenerator
                data={qrData}
                size={200}
              />
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerateQRCode}
                  disabled={regenerating}
                  className="flex items-center gap-2"
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {t('regenerateQrCode')}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <div className="text-xs text-muted-foreground">
            {t('scanQrCodeToValidate')}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationQRModal;
