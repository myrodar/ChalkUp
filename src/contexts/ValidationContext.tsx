import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/use-translation';
import { updateAttempt, getCurrentCompetition, setBoulderValidated } from '@/lib/database';

export interface ValidationRequest {
  id: string;
  climberId: string;
  climberName: string;
  boulderId: string;
  boulderName: string;
  boulderColor: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  attemptCount?: number;
}

interface ValidationContextType {
  pendingRequests: ValidationRequest[];
  incomingRequest: ValidationRequest | null;
  showValidationModal: boolean;
  createValidationRequest: (boulderId: string, boulderName: string, boulderColor: string, attemptCount: number) => Promise<void>;
  respondToValidation: (requestId: string, approved: boolean) => Promise<void>;
  closeValidationModal: () => void;
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

export const ValidationProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [pendingRequests, setPendingRequests] = useState<ValidationRequest[]>([]);
  const [incomingRequest, setIncomingRequest] = useState<ValidationRequest | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Fetch pending validation requests
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchPendingRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('validation_requests')
          .select(`
            id,
            climber_id,
            boulder_id,
            created_at,
            status,
            profiles!validation_requests_climber_id_fkey(name),
            boulders(name, color)
          `)
          .eq('status', 'pending')
          .neq('climber_id', session.user.id);

        if (error) throw error;

        if (data) {
          const formattedRequests: ValidationRequest[] = data.map(item => ({
            id: item.id,
            climberId: item.climber_id,
            climberName: item.profiles?.name || 'Unknown Climber',
            boulderId: item.boulder_id,
            boulderName: item.boulders?.name || 'Unknown Boulder',
            boulderColor: item.boulders?.color || 'Unknown Color',
            timestamp: item.created_at,
            status: item.status
          }));
          setPendingRequests(formattedRequests);
        }
      } catch (error) {
        console.error('Error fetching validation requests:', error);
      }
    };

    fetchPendingRequests();

    // Subscribe to new validation requests
    const channel = supabase
      .channel('validation_requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'validation_requests',
        filter: `status=eq.pending`
      }, async (payload) => {
        // Only show notifications for requests that aren't from the current user
        if (payload.new.climber_id !== session.user.id) {
          try {
            // Fetch additional data about the request
            const { data: climberData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', payload.new.climber_id)
              .single();

            const { data: boulderData } = await supabase
              .from('boulders')
              .select('name, color')
              .eq('id', payload.new.boulder_id)
              .single();

            const newRequest: ValidationRequest = {
              id: payload.new.id,
              climberId: payload.new.climber_id,
              climberName: climberData?.name || 'Unknown Climber',
              boulderId: payload.new.boulder_id,
              boulderName: boulderData?.name || 'Unknown Boulder',
              boulderColor: boulderData?.color || 'Unknown Color',
              timestamp: payload.new.created_at,
              status: payload.new.status,
              attemptCount: payload.new.attempt_count
            };

            // Update the pending requests list
            setPendingRequests(prev => [...prev, newRequest]);

            // Show the incoming request modal
            setIncomingRequest(newRequest);
            setShowValidationModal(true);

            // Play a sound notification
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Error playing notification sound:', e));
          } catch (error) {
            console.error('Error processing new validation request:', error);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const createValidationRequest = async (boulderId: string, boulderName: string, boulderColor: string, attemptCount: number) => {
    if (!session?.user?.id) {
      toast({
        title: t('error'),
        description: t('mustBeLoggedIn'),
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('validation_requests')
        .insert({
          climber_id: session.user.id,
          boulder_id: boulderId,
          status: 'pending',
          attempt_count: attemptCount
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('validationRequestSent'),
        description: t('waitingForValidation'),
      });
    } catch (error: any) {
      console.error('Error creating validation request:', error);
      toast({
        title: t('error'),
        description: error.message || t('errorCreatingRequest'),
        variant: "destructive"
      });
    }
  };

  const respondToValidation = async (requestId: string, approved: boolean) => {
    if (!session?.user?.id) return;

    try {
      // Update the validation request status
      const { error } = await supabase
        .from('validation_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          validator_id: session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, update the attempt record using shared database logic
      if (approved) {
        // Get the request details
        const { data: requestData, error: requestError } = await supabase
          .from('validation_requests')
          .select('climber_id, boulder_id, attempt_count')
          .eq('id', requestId)
          .single();
        if (requestError || !requestData) {
          console.error('Error fetching validation request details:', requestError);
          throw requestError || new Error('Validation request not found');
        }
        // Determine current competition
        const competition = await getCurrentCompetition();
        if (!competition) {
          throw new Error('Unable to determine current competition');
        }
        const competitionId = competition.id;
        // Update attempt count and mark as validated
        console.log('Updating attempt with validated=true for request:', requestId);
        console.log('Request data:', requestData);
        console.log('Competition ID:', competitionId);

        try {
          // First use the updateAttempt function
          await updateAttempt(
            requestData.climber_id,
            requestData.boulder_id,
            'send',
            requestData.attempt_count || 1,
            competitionId,
            true
          );
          console.log('Attempt record updated for request', requestId);

          // Then directly set the validated flag as a backup
          const validationResult = await setBoulderValidated(requestData.climber_id, requestData.boulder_id, true);
          console.log('Direct validation result:', validationResult);

          console.log('Attempt record validated for request', requestId);
        } catch (updateError) {
          console.error('Error updating attempt:', updateError);
          throw updateError;
        }
      }

      // Remove the request from the pending list
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));

      // Close the modal
      setShowValidationModal(false);
      setIncomingRequest(null);

      toast({
        title: approved ? t('validationApproved') : t('validationRejected'),
        description: approved
          ? t('climbRecorded')
          : t('validationRejectedDesc'),
      });
    } catch (error: any) {
      console.error('Error responding to validation:', error);
      toast({
        title: t('error'),
        description: error.message || t('errorRespondingToValidation'),
        variant: "destructive"
      });
    }
  };

  const closeValidationModal = () => {
    setShowValidationModal(false);
    setIncomingRequest(null);
  };

  return (
    <ValidationContext.Provider
      value={{
        pendingRequests,
        incomingRequest,
        showValidationModal,
        createValidationRequest,
        respondToValidation,
        closeValidationModal
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
};

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (context === undefined) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};
