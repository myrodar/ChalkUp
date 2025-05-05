
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, CheckCircle2, Clock, BadgeCheck } from 'lucide-react';
import { isBoulderValidated } from '@/lib/database';
import { Card } from '@/components/ui/card';
import { Boulder, AttemptCount } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import ValidationRequestButton from './ValidationRequestButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';

interface BoulderCardProps {
  boulder: Boulder;
  sendAttempts: AttemptCount;
  onAttemptsChange: (
    boulderId: string,
    type: 'send',
    attempts: number
  ) => void;
  disabled?: boolean;
  isBestBoulder?: boolean;
  isValidated?: boolean;
}

const BoulderCard = ({
  boulder,
  sendAttempts,
  onAttemptsChange,
  disabled = false,
  isBestBoulder = false,
  isValidated: propIsValidated = false
}: BoulderCardProps) => {
  const [isValidated, setIsValidated] = useState(propIsValidated);
  console.log(`BoulderCard ${boulder.id} props:`, { sendAttempts, disabled, isBestBoulder, isValidated: propIsValidated });
  const { t } = useTranslation();
  const { session } = useAuth();
  const [hasPendingValidation, setHasPendingValidation] = useState(false);

  // Update isValidated when propIsValidated changes
  useEffect(() => {
    console.log(`Boulder ${boulder.id} propIsValidated changed to:`, propIsValidated);
    if (propIsValidated) {
      setIsValidated(true);
    }
  }, [boulder.id, propIsValidated]);

  // Check if the boulder is validated when the component mounts
  useEffect(() => {
    if (!session?.user?.id) return;

    const checkValidationStatus = async () => {
      try {
        // First check the prop value
        if (propIsValidated) {
          console.log(`Boulder ${boulder.id} is validated via props`);
          setIsValidated(true);
          return;
        }

        // Then check directly from the database
        const { data, error } = await supabase
          .from('attempts')
          .select('validated')
          .eq('userId', session.user.id)
          .eq('boulderId', boulder.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking validation status:', error);
          return;
        }

        const validated = data?.validated === true;
        console.log(`Boulder ${boulder.id} validation check result:`, validated);
        setIsValidated(validated);

        // Also check using the isBoulderValidated function as a backup
        const backupCheck = await isBoulderValidated(session.user.id, boulder.id);
        console.log(`Boulder ${boulder.id} backup validation check:`, backupCheck);
        if (backupCheck && !validated) {
          console.log(`Boulder ${boulder.id} validated via backup check`);
          setIsValidated(true);
        }
      } catch (error) {
        console.error('Error checking boulder validation status:', error);
      }
    };

    checkValidationStatus();

    // Subscribe to changes in the attempts table
    const channel = supabase
      .channel(`attempts_${boulder.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attempts',
        filter: `boulderId=eq.${boulder.id}`,
      }, (payload: { new: Record<string, any> }) => {
        console.log(`Detected change in attempts for boulder ${boulder.id}:`, payload);

        // Immediately update if the boulder was validated
        if (payload.new &&
            payload.new.userId === session.user.id &&
            payload.new.boulderId === boulder.id &&
            payload.new.validated === true) {
          console.log(`Boulder ${boulder.id} was validated, updating UI immediately`);
          setIsValidated(true);
        } else {
          // Otherwise check the validation status
          checkValidationStatus();
        }
      })
      .subscribe();

    // Also subscribe to validation_requests table
    const validationChannel = supabase
      .channel(`validation_requests_${boulder.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'validation_requests',
        filter: `boulder_id=eq.${boulder.id}`,
      }, () => {
        console.log(`Detected change in validation_requests for boulder ${boulder.id}`);
        checkValidationStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(validationChannel);
    };
  }, [boulder.id, session?.user?.id, propIsValidated]);

  // Check if there's a pending validation request for this boulder
  useEffect(() => {
    if (!session?.user?.id || sendAttempts === 'none') return;

    const checkPendingValidation = async () => {
      const { data } = await supabase
        .from('validation_requests')
        .select('id')
        .eq('climber_id', session.user.id)
        .eq('boulder_id', boulder.id)
        .eq('status', 'pending')
        .maybeSingle();

      setHasPendingValidation(!!data);
    };

    checkPendingValidation();

    // Subscribe to changes in validation_requests
    const channel = supabase
      .channel(`validation_${boulder.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'validation_requests',
        filter: `boulder_id=eq.${boulder.id}`,
      }, () => {
        checkPendingValidation();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boulder.id, session?.user?.id, sendAttempts]);

  const handleSendAttemptsChange = (attempts: number) => {
    console.log(`BoulderCard: Attempting to change boulder ${boulder.id} to ${attempts} attempts`);
    console.log('BoulderCard: isValidated =', isValidated);

    // Don't allow changes if disabled or validated
    if (disabled || isValidated) {
      console.log('BoulderCard: Change prevented due to disabled or validated status');
      return;
    }
    // Toggle logic: if already this count, set to 0, otherwise set to new count
    const newCount = sendAttempts === attempts.toString() as AttemptCount ? 0 : attempts;
    console.log('BoulderCard: Calling onAttemptsChange with newCount =', newCount);
    onAttemptsChange(boulder.id, 'send', newCount);
  };

  // Zone attempts are no longer used

  // Calculate points based on current attempt status
  const calculateSendPoints = (attempts: AttemptCount): number => {
    if (attempts === 'none') return 0;
    const attemptsNum = parseInt(attempts);
    switch (attemptsNum) {
      case 1: return boulder.pointsForFirst;
      case 2: return boulder.pointsForSecond;
      case 3: return boulder.pointsForThird;
      case 4: return boulder.pointsForFourth;
      case 5: return boulder.pointsForFifth;
      default: return 0;
    }
  };
  const  capitalizeFirstLetter = (str: string) => {
    if (!str) return '';
    return str[0].toUpperCase() + str.slice(1);
  }

  // Zone points are no longer counted in the score
  const pointsEarned = calculateSendPoints(sendAttempts);

  const attemptCounts = [1, 2, 3, 4, 5];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className={`overflow-hidden hover-lift transition-all duration-300
        ${disabled ? 'opacity-75' : ''}
        ${isBestBoulder ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${isValidated ? 'ring-2 ring-green-500 ring-offset-2 bg-green-50 dark:bg-green-900/20' : ''}`}>
        {isValidated && (
          <div className="bg-green-500 text-white py-1 px-3 text-center text-sm font-medium flex items-center justify-center gap-1">
            <BadgeCheck className="h-4 w-4" />
            {t('validatedBoulder')}
          </div>
        )}
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center mb-2">
                <span
                  className="inline-block w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: boulder.color }}
                />
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                  {capitalizeFirstLetter(boulder.color)}
                </span>
                {isValidated && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <BadgeCheck className="h-3 w-3 mr-1" />
                    {t('validated')}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold">{boulder.name}</h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">{t('points')}</div>
              <div className="font-semibold">
                {boulder.pointsForFirst} <span className="text-xs">{t('send')}</span>
              </div>
              {isBestBoulder && sendAttempts !== 'none' && (
                <div className="mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-white inline-block">
                  {t('bestBoulder')}
                </div>
              )}
            </div>
          </div>

          {/* Send Attempts Section */}
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <CheckCircle2 size={16} className="mr-2 text-green-500" />
              <span className="font-medium">{t('sendAttempts')}</span>
              {isValidated && (
                <span className="ml-auto text-xs text-green-600 dark:text-green-400 flex items-center">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  {t('validated')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {attemptCounts.map(count => (
                <Button
                  key={`send-${count}`}
                  size="sm"
                  variant={sendAttempts === count.toString() ? "default" : "outline"}
                  className={`
                    ${sendAttempts === count.toString()
                      ? hasPendingValidation
                        ? "bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 flex items-center gap-1"
                        : "bg-green-500 hover:bg-green-600"
                      : ""}
                    ${isValidated ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700" : ""}
                  `}
                  onClick={() => handleSendAttemptsChange(count)}
                  disabled={disabled || hasPendingValidation || isValidated}
                  aria-disabled={isValidated}
                >
                  {count}
                  {sendAttempts === count.toString() && hasPendingValidation && (
                    <Clock className="h-3 w-3 ml-1" />
                  )}
                </Button>
              ))}
            </div>
          </div>
          {/*

          /* Zone Attempts Section - Always show
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Flag size={16} className="mr-2 text-blue-500" />
              <span className="font-medium">{t('zoneAttempts')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {attemptCounts.map(count => (
                <Button
                  key={`zone-${count}`}
                  size="sm"
                  variant={zoneAttempts === count.toString() ? "default" : "outline"}
                  className={zoneAttempts === count.toString() ? "bg-blue-500 hover:bg-blue-600" : ""}
                  onClick={() => handleZoneAttemptsChange(count)}
                  disabled={disabled}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
          */}
          {pointsEarned > 0 && (
            <div className="mt-4 p-2 bg-slate-50 dark:bg-slate-800 rounded text-center">
              <span className="text-sm font-medium">
                {t('pointsEarned')}: <span className="text-primary font-bold">{pointsEarned}</span>
              </span>
              {isValidated && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                  <BadgeCheck className="h-3 w-3" />
                  {t('cannotBeModified')}
                </div>
              )}
            </div>
          )}

          {/* Validation Request Button - Show when a send attempt is clicked and not validated */}
          {sendAttempts !== 'none' && !disabled && !isValidated && (
            <div className="mt-2">
              {hasPendingValidation && (
                <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded text-center flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    {t('waitingForValidation')}
                  </span>
                </div>
              )}
              <ValidationRequestButton boulder={boulder} attemptCount={parseInt(sendAttempts)} />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default BoulderCard;
