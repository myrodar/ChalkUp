import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, User, Mountain } from 'lucide-react';
import QRScanner from './QRScanner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';
import { setBoulderValidated, forceUpdateAttemptValidated } from '@/lib/database';

// Helper function to capitalize the first letter of a string
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Types for the boulder and profile data
interface BoulderData {
  name: string;
  color: string;
  [key: string]: any;
}

interface ProfileData {
  name: string;
  [key: string]: any;
}

// Types for the QR code data you expect to receive.
interface ValidationData {
  type: string;
  userId: string;
  boulderId: string;
  boulderName: string;
  boulderColor: string;
  attemptCount: number;
  timestamp: string;
  requestId?: string; // ID of the validation request in the DB
  climberName?: string; // For display
}

// Props for your ScannerModal component
interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScannerModal = ({ isOpen, onClose }: ScannerModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { session } = useAuth();
  const [scannedData, setScannedData] = useState<ValidationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle a successful QR scan
  const handleScan = async (data: string) => {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // If it's a UUID, assume it's the QR token from a validation request
      if (uuidRegex.test(data)) {
        // Look up the validation request using the token directly from Supabase
        console.log('Looking up validation request with QR token:', data);

        // First, update the scanned_at timestamp to mark this QR code as scanned
        const { error: updateError } = await supabase
          .from('validation_requests')
          .update({ scanned_at: new Date().toISOString() })
          .eq('qr_token', data);

        if (updateError) {
          console.error('Error updating scanned_at timestamp:', updateError);
          // Continue anyway, this is not critical
        }

        // Look up the validation request using the token
        console.log('Looking up validation request with QR token:', data);
        const { data: requestData, error: requestError } = await supabase
        .from('validation_requests')
        .select(`
          id,
          climber_id,
          boulder_id,
          status,
          attempt_count,
          created_at,
          profiles:climber_id(name),
          boulders:boulder_id(name, color)
        `)
        .eq('qr_token', data)
        .eq('status', 'pending')
        .maybeSingle();    // ← changed from .single()

        console.log('Validation request lookup result:', requestData);

        if (requestError) {
        console.error('Error fetching validation request:', requestError);
        throw new Error(t('invalidOrExpiredQrCode'));
        }

        // If there’s no pending request for this token, bail out gracefully
        if (!requestData) {
        toast({
          title: t('scanNotFound'),
          description: t('noPendingRequestFound'),
          variant: 'destructive',
        });
        return;
        }

        // **Notify success** before you set state
        toast({
          title: t('scanSuccessful'),
          description: t('validationRequestFound'),
          variant: 'default',
        });

        // …now format your validationData and call setScannedData(validationData)


        // Format the validation data
        console.log('Request data:', JSON.stringify(requestData, null, 2));

        // Extract boulder and profile data - handle both array and object formats
        let boulderName = 'Unknown Boulder';
        let boulderColor = 'Unknown Color';
        let climberName = 'Unknown Climber';

        if (requestData.boulders) {
          // Use type assertion to handle both array and object formats
          const boulders = requestData.boulders as BoulderData | BoulderData[];
          if (Array.isArray(boulders) && boulders.length > 0) {
            boulderName = boulders[0].name || boulderName;
            boulderColor = boulders[0].color || boulderColor;
          } else if (typeof boulders === 'object') {
            boulderName = (boulders as BoulderData).name || boulderName;
            boulderColor = (boulders as BoulderData).color || boulderColor;
          }
        }

        if (requestData.profiles) {
          // Use type assertion to handle both array and object formats
          const profiles = requestData.profiles as ProfileData | ProfileData[];
          if (Array.isArray(profiles) && profiles.length > 0) {
            climberName = profiles[0].name || climberName;
          } else if (typeof profiles === 'object') {
            climberName = (profiles as ProfileData).name || climberName;
          }
        }

        // Ensure boulder_id is a string
        const boulderId = String(requestData.boulder_id);
        console.log('Boulder ID from request:', boulderId);

        const validationData: ValidationData = {
          type: 'boulder_validation',
          userId: requestData.climber_id,
          boulderId: boulderId,
          boulderName,
          boulderColor,
          attemptCount: requestData.attempt_count,
          timestamp: requestData.created_at,
          requestId: requestData.id,
          climberName
        };

        console.log('Created validation data:', validationData);

        console.log('Validation data:', validationData);
        setScannedData(validationData);
      } else {
        // Fallback: try to parse as JSON
        try {
          const parsedData = JSON.parse(data) as ValidationData;
          if (
            parsedData.type === 'boulder_validation' &&
            parsedData.userId &&
            parsedData.boulderId &&
            parsedData.boulderName &&
            parsedData.attemptCount
          ) {
            setScannedData(parsedData);
          } else {
            throw new Error('Invalid data structure');
          }
        } catch (parseError) {
          throw new Error(t('invalidQrCodeFormat'));
        }
      }
    } catch (error: unknown) {
      console.error('Error processing QR code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: t('invalidQrCode'),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Approve or reject the scanned data
  const handleValidate = async (approved: boolean) => {
    if (!scannedData || !session?.user?.id) return;
    setIsProcessing(true);

    try {
      console.log('Validating scan data:', scannedData);
      console.log('User ID:', session.user.id);
      console.log('Approved:', approved);

      // If we have a requestId, update an existing validation request
      if (scannedData.requestId) {
        console.log('Updating existing validation request with ID:', scannedData.requestId);

        // Create update object without updated_at first
        const updateData = {
          validator_id: session.user.id,
          status: approved ? 'approved' : 'rejected'
        };

        // Try to update with the basic fields first
        const { error } = await supabase
          .from('validation_requests')
          .update(updateData)
          .eq('id', scannedData.requestId);

        if (error) {
          console.error('Error updating validation request:', error);
          throw error;
        }

        console.log('Validation request updated successfully');
      } else {
        // Otherwise create a new record
        console.log('No requestId found, creating new validation record');
        // Create insert object without updated_at
        const insertData = {
          climber_id: scannedData.userId,
          boulder_id: String(scannedData.boulderId), // Ensure boulder_id is a string
          validator_id: session.user.id,
          status: approved ? 'approved' : 'rejected',
          attempt_count: scannedData.attemptCount,
          created_at: scannedData.timestamp || new Date().toISOString()
        };

        console.log('Inserting validation request with data:', insertData);

        const { error } = await supabase
          .from('validation_requests')
          .insert(insertData);

        if (error) {
          console.error('Error creating validation record:', error);
          throw error;
        }
      }

      // If approved, update or create the climb record in 'attempts'
      if (approved) {
        console.log('Approved validation, updating attempts record');

        try {
          // Check if climb record already exists
          console.log('Checking for existing climb with userId:', scannedData.userId, 'boulderId:', scannedData.boulderId);
          const { data: existingClimb, error: existingClimbError } = await supabase
            .from('attempts')
            .select('*')
            .eq('userId', scannedData.userId)
            .eq('boulderId', String(scannedData.boulderId)) // Ensure boulderId is a string
            .maybeSingle();

          console.log('Existing climb data:', existingClimb);

          if (existingClimbError) {
            console.error('Error checking for existing climb:', existingClimbError);
          }

          console.log('Existing climb check result:', existingClimb);

          // Get current competition
          const { data: currentCompetition, error: competitionError } = await supabase
            .from('competitions')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (competitionError) {
            console.error('Error getting current competition:', competitionError);
          }

          console.log('Current competition:', currentCompetition);
          // Ensure competitionId is an integer
          const competitionId = typeof currentCompetition?.id === 'string'
            ? parseInt(currentCompetition.id, 10)
            : (currentCompetition?.id || 1); // Default to 1 if no competition found
          console.log('Using competitionId:', competitionId, 'type:', typeof competitionId);

          if (existingClimb) {
            console.log('Updating existing climb record');
            // Update existing climb record
            // Create the update data object
            const updateData = {
              sendattempts: scannedData.attemptCount,
              status: 'sent',
              competitionid: competitionId,
              timestamp: new Date().toISOString(),
              validated: true // Mark as validated
            };

            console.log('Updating attempt with data:', updateData);

            // Update the existing climb record by its unique ID
            const { error: updateError } = await supabase
              .from('attempts')
              .update(updateData)
              .eq('id', existingClimb.id);

            if (updateError) {
              console.error('Error updating attempt:', updateError);
              throw updateError;
            }

            console.log('Attempt record updated successfully');

            // Directly set the validated flag as a backup using multiple methods
            console.log('Ensuring validation with multiple methods...');

            // First try the force update method
            try {
              console.log('Trying forceUpdateAttemptValidated...');
              const forceResult = await forceUpdateAttemptValidated(scannedData.userId, String(scannedData.boulderId), true);
              console.log('Force update result:', forceResult);
            } catch (forceError) {
              console.error('Error in force update:', forceError);
            }

            // Then try the regular method
            try {
              console.log('Trying setBoulderValidated...');
              const validationResult = await setBoulderValidated(scannedData.userId, String(scannedData.boulderId), true);
              console.log('Direct validation result:', validationResult);
            } catch (validationError) {
              console.error('Error in validation:', validationError);
            }
          } else {
            console.log('Creating new climb record');
            // Create new climb record
            // Create a unique ID for the attempt
            const attemptId = `${scannedData.userId}_${scannedData.boulderId}_${competitionId}`;
            console.log('Generated attempt ID:', attemptId);

            // Create the attempt data object
            const attemptData = {
              id: attemptId,
              userId: scannedData.userId,
              boulderId: String(scannedData.boulderId), // Ensure boulderId is a string
              sendattempts: scannedData.attemptCount,
              zoneattempts: 0,
              status: 'sent',
              competitionid: competitionId, // Use the competition ID we already fetched
              timestamp: new Date().toISOString(),
              validated: true // Mark as validated
            };

            console.log('Creating attempt with data:', attemptData);

            const { error: insertError } = await supabase
              .from('attempts')
              .insert(attemptData);

            if (insertError) {
              console.error('Error creating attempt:', insertError);
              throw insertError;
            }

            console.log('Attempt record created successfully');

            // Directly set the validated flag as a backup using multiple methods
            console.log('Ensuring validation with multiple methods...');

            // First try the force update method
            try {
              console.log('Trying forceUpdateAttemptValidated...');
              const forceResult = await forceUpdateAttemptValidated(scannedData.userId, String(scannedData.boulderId), true);
              console.log('Force update result:', forceResult);
            } catch (forceError) {
              console.error('Error in force update:', forceError);
            }

            // Then try the regular method
            try {
              console.log('Trying setBoulderValidated...');
              const validationResult = await setBoulderValidated(scannedData.userId, String(scannedData.boulderId), true);
              console.log('Direct validation result:', validationResult);
            } catch (validationError) {
              console.error('Error in validation:', validationError);
            }
          }
        } catch (attemptError) {
          console.error('Error handling attempts:', attemptError);
          // Don't throw here, we still want to show success for the validation
          // Just log the error
        }
      }

      toast({
        title: approved ? t('validationApproved') : t('validationRejected'),
        description: approved ? t('climbRecorded') : t('validationRejectedDesc'),
      });

      // Reset and close
      setScannedData(null);
      onClose();
    } catch (error: unknown) {
      console.error('Error processing validation:', error);
      const errorMessage = error instanceof Error ? error.message : t('errorProcessingValidation');

      // Try to directly update the attempts table as a last resort
      if (approved && scannedData) {
        try {
          console.log('Attempting direct update as last resort...');

          // Try multiple approaches to ensure the update happens
          let updateSuccessful = false;

          // First try the force update method
          try {
            console.log('Trying forceUpdateAttemptValidated...');
            const forceResult = await forceUpdateAttemptValidated(scannedData.userId, String(scannedData.boulderId), true);
            console.log('Force update result:', forceResult);
            updateSuccessful = forceResult;
          } catch (forceError) {
            console.error('Error in force update:', forceError);
          }

          // If force update failed, try the regular method
          if (!updateSuccessful) {
            console.log('Force update failed, trying setBoulderValidated...');
            const directResult = await setBoulderValidated(scannedData.userId, String(scannedData.boulderId), true);
            console.log('Direct update result:', directResult);
            updateSuccessful = directResult;
          }

          // If either method succeeded, show success message
          if (updateSuccessful) {
            toast({
              title: t('validationSuccessful'),
              description: t('validationCompletedWithFallback'),
            });
            setScannedData(null);
            onClose();
            return;
          }
        } catch (fallbackError) {
          console.error('Error in fallback validation:', fallbackError);
        }
      }

      toast({
        title: t('error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Allow the user to scan again
  const resetScan = () => {
    setScannedData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('scanValidationQrCode')}</DialogTitle>
          <DialogDescription>
            {scannedData ? t('confirmValidation') : t('scanQrCodeDescription')}
          </DialogDescription>
        </DialogHeader>

        {!scannedData ? (
          <QRScanner onScan={handleScan} onClose={onClose} />
        ) : (
          <div className="py-4">
            <div className="grid gap-4">
              <div className="flex items-center gap-4 p-3 rounded-lg border">
                <User className="h-10 w-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('climber')}</p>
                  <p className="font-medium">
                    {scannedData.climberName || scannedData.userId}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-lg border">
                <Mountain className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-medium">{scannedData.boulderName}</p>
                  <div className="flex items-center mt-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: scannedData.boulderColor }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {capitalizeFirstLetter(scannedData.boulderColor)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                    {t('attempts')}:&nbsp;
                    <span className="font-medium">{scannedData.attemptCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex sm:justify-between mt-6">
              <Button
                variant="outline"
                onClick={resetScan}
                disabled={isProcessing}
              >
                {t('scanAgain')}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleValidate(false)}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  {t('reject')}
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleValidate(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  {t('validate')}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScannerModal;