import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from '@/components/Navbar';
import BoulderCard from '@/components/BoulderCard';
import { Boulder, AttemptCount, Competition } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { RefreshCw, Trophy, CheckCircle2, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/App';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBoulders, fetchUserAttempts, updateAttempt, getCurrentCompetition, isBoulderValidated } from '@/lib/database';
import { useTranslation } from '@/hooks/use-translation';
import ScannerModal from '@/components/ScannerModal';

const Dashboard = () => {
  const { session, loading, currentCompetitionId, setCurrentCompetitionId } = useAuth();
  const [sendAttempts, setSendAttempts] = useState<Record<string, AttemptCount>>({});
  const [validatedBoulders, setValidatedBoulders] = useState<Record<string, boolean>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [bestBoulderIds, setBestBoulderIds] = useState<string[]>([]);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [session, loading, navigate]);

  // Fetch user profile from user_metadata
  const userProfile = session?.user?.user_metadata || {};
  const userName = userProfile.name || session?.user?.email?.split('@')[0] || 'Climber';

  // Fetch current competition if not set
  const { data: competition } = useQuery<Competition | null>({
    queryKey: ['currentCompetition'],
    queryFn: () => getCurrentCompetition(),
    enabled: !!session && !currentCompetitionId
  });

  // Update competition ID when data is fetched
  useEffect(() => {
    if (competition && !currentCompetitionId) {
      setCurrentCompetitionId(competition.id);
    }
  }, [competition, currentCompetitionId, setCurrentCompetitionId]);

  // Fetch boulders for the current competition
  const { data: boulders = [], isLoading: isLoadingBoulders } = useQuery({
    queryKey: ['boulders', currentCompetitionId],
    queryFn: async () => {
      if (!currentCompetitionId) return [];
      try {
        return await fetchBoulders(currentCompetitionId);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          title: "Error fetching boulders",
          description: errorMessage,
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!session && !!currentCompetitionId,
  });

  // Fetch user attempts for the current competition
  const { data: userAttempts = [], isLoading: isLoadingAttempts, refetch: refetchAttempts } = useQuery({
    queryKey: ['attempts', session?.user?.id, currentCompetitionId],
    queryFn: async () => {
      if (!session?.user?.id || !currentCompetitionId) return [];
      console.log('Fetching user attempts...');
      return await fetchUserAttempts(session.user.id, currentCompetitionId.toString());
    },
    enabled: !!session?.user?.id && !!currentCompetitionId,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Force a refetch when the component mounts
  useEffect(() => {
    if (session?.user?.id && currentCompetitionId) {
      console.log('Forcing refetch of user attempts...');
      refetchAttempts();

      // Subscribe to changes in the attempts table
      const channel = supabase
        .channel('dashboard_attempts')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'attempts',
          filter: `userId=eq.${session.user.id}`,
        }, (payload: { new: Record<string, any> }) => {
          console.log('Detected change in attempts:', payload);

          // Immediately update the validatedBoulders state if a boulder was validated
          if (payload.new && payload.new.validated === true && payload.new.boulderId) {
            console.log(`Boulder ${payload.new.boulderId} was validated, updating UI...`);
            setValidatedBoulders(prev => ({
              ...prev,
              [payload.new.boulderId]: true
            }));
          }

          // Also refetch to ensure we have the latest data
          refetchAttempts();
        })
        .subscribe();

      // Subscribe to changes in the validation_requests table
      const validationChannel = supabase
        .channel('dashboard_validations')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'validation_requests',
          filter: `climber_id=eq.${session.user.id}`,
        }, () => {
          console.log('Detected change in validation_requests, refetching...');
          refetchAttempts();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(validationChannel);
      };
    }
  }, [session?.user?.id, currentCompetitionId, refetchAttempts]);

  // Calculate attempts records and total points when data changes
  useEffect(() => {
    if (boulders.length > 0 && userAttempts.length >= 0) {
      // Initialize attempt records
      const sendAttemptsRecord: Record<string, AttemptCount> = {};
      const validatedBouldersRecord: Record<string, boolean> = {};

      boulders.forEach(boulder => {
        sendAttemptsRecord[boulder.id] = 'none';
        validatedBouldersRecord[boulder.id] = false;
      });

      console.log('User attempts:', userAttempts);

      // Update with actual attempts
      userAttempts.forEach((attempt: unknown) => {
        const typedAttempt = attempt as { sendAttempts: number, boulderId: string, validated?: boolean };
        console.log('Processing attempt:', typedAttempt);
        if (typedAttempt.sendAttempts) {
          sendAttemptsRecord[typedAttempt.boulderId] = typedAttempt.sendAttempts.toString() as AttemptCount;
          validatedBouldersRecord[typedAttempt.boulderId] = typedAttempt.validated || false;
          console.log(`Boulder ${typedAttempt.boulderId} validated:`, typedAttempt.validated);
        }
      });

      console.log('Validated boulders record:', validatedBouldersRecord);

      // Double-check validation status for each boulder
      if (session?.user?.id) {
        const checkValidationStatus = async () => {
          for (const boulder of boulders) {
            try {
              const { data } = await supabase
                .from('attempts')
                .select('validated')
                .eq('userId', session.user.id)
                .eq('boulderId', boulder.id)
                .maybeSingle();

              if (data?.validated === true) {
                console.log(`Found validated boulder ${boulder.id} in database`);
                validatedBouldersRecord[boulder.id] = true;
              }
            } catch (error) {
              console.error(`Error checking validation for boulder ${boulder.id}:`, error);
            }
          }

          console.log('Updated validated boulders record:', validatedBouldersRecord);
          setValidatedBoulders(validatedBouldersRecord);
          calculateTotalPoints(boulders, sendAttemptsRecord, validatedBouldersRecord);
        };

        checkValidationStatus();
      }

      setSendAttempts(sendAttemptsRecord);
      setValidatedBoulders(validatedBouldersRecord);
      calculateTotalPoints(boulders, sendAttemptsRecord, validatedBouldersRecord);
    }
  }, [boulders, userAttempts, session?.user?.id]);

  // Mutation for updating attempts
  const updateAttemptMutation = useMutation({
    mutationFn: async ({
      boulderId,
      type,
      attempts
    }: {
      boulderId: string,
      type: 'send' | 'zone',
      attempts: number
    }) => {
      console.log('==== MUTATION FUNCTION STARTED ====');

      if (!session?.user?.id) {
        console.error('User not logged in');
        throw new Error("User not logged in");
      }

      if (!currentCompetitionId) {
        console.error('Competition not selected');
        throw new Error("Competition not selected");
      }

      // Keep competitionId as an integer
      const competitionId = typeof currentCompetitionId === 'string'
        ? parseInt(currentCompetitionId, 10)
        : currentCompetitionId;

      console.log('Using competitionId:', competitionId, 'type:', typeof competitionId);
      console.log('User ID:', session.user.id);
      console.log('Boulder ID:', boulderId);
      console.log('Type:', type);
      console.log('Attempts:', attempts);

      try {
        const result = await updateAttempt(
          session.user.id,
          boulderId,
          type,
          attempts,
          competitionId
        );

        console.log('updateAttempt result:', result);
        console.log('==== MUTATION FUNCTION COMPLETED SUCCESSFULLY ====');
        return result;
      } catch (error) {
        console.error('==== MUTATION FUNCTION FAILED ====');
        console.error('Error in updateAttempt:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch attempts
      queryClient.invalidateQueries({
        queryKey: ['attempts', session?.user?.id, currentCompetitionId]
      });
    },
    onError: (error: unknown) => {
      console.error('Error in updateAttemptMutation:', error);

      let errorMessage = 'Failed to save your progress';

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', error.stack);
      }

      // Try to extract more details if it's a Supabase error
      const supabaseError = error as { code?: string; details?: string; hint?: string; message?: string };
      if (supabaseError.code || supabaseError.details || supabaseError.hint) {
        console.error('Supabase error details:', {
          code: supabaseError.code,
          details: supabaseError.details,
          hint: supabaseError.hint,
          message: supabaseError.message
        });
      }

      toast({
        title: "Error updating attempt",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const calculateTotalPoints = (
    boulders: Boulder[],
    sendAttemptsRecord: Record<string, AttemptCount>,
    validatedBouldersRecord: Record<string, boolean>
  ) => {
    // Calculate points for each boulder
    const boulderPoints: { boulderId: string; points: number }[] = [];

    boulders.forEach(boulder => {
      const sendStatus = sendAttemptsRecord[boulder.id];
      const isValidated = validatedBouldersRecord[boulder.id];

      // Only count points for validated boulders
      if (sendStatus !== 'none' && isValidated) {
        const attemptNum = parseInt(sendStatus);
        let points = 0;

        // Calculate points based on attempt number
        switch (attemptNum) {
          case 1: points = boulder.pointsForFirst; break;
          case 2: points = boulder.pointsForSecond; break;
          case 3: points = boulder.pointsForThird; break;
          case 4: points = boulder.pointsForFourth; break;
          case 5: points = boulder.pointsForFifth; break;
        }

        boulderPoints.push({ boulderId: boulder.id, points });
      }
    });

    // Sort boulders by points in descending order
    boulderPoints.sort((a, b) => b.points - a.points);

    // Take only the 6 best boulders (or all if less than 6)
    const bestBoulders = boulderPoints.slice(0, 6);

    // Sum up the points from the best boulders
    const totalPoints = bestBoulders.reduce((sum, boulder) => sum + boulder.points, 0);

    // Store the best boulder IDs for highlighting in UI
    const topBoulderIds = bestBoulders.map(b => b.boulderId);
    setBestBoulderIds(topBoulderIds);
    setTotalPoints(totalPoints);
  };

  const handleAttemptsChange = async (
    boulderId: string,
    type: 'send',
    attempts: number
  ) => {
    try {
      console.log(`Attempting to change boulder ${boulderId} to ${attempts} attempts`);
      console.log('Current validated status from state:', validatedBoulders[boulderId]);
      console.log('Current competition ID:', currentCompetitionId, 'type:', typeof currentCompetitionId);

      // Double-check if the boulder is validated directly from the database
      if (session?.user?.id) {
        const isValidated = await isBoulderValidated(session.user.id, boulderId);
        console.log(`Boulder ${boulderId} validation check result:`, isValidated);

        if (isValidated) {
          console.log(`Boulder ${boulderId} is validated, preventing changes`);
          toast({
            title: t('validatedBoulder'),
            description: t('cannotModifyValidatedBoulder'),
            variant: "destructive",
          });
          return;
        }
      }

      // Update local state immediately for a responsive UI
      const newSendAttempts = { ...sendAttempts };
      newSendAttempts[boulderId] = attempts === 0 ? 'none' : attempts.toString() as AttemptCount;
      setSendAttempts(newSendAttempts);
      calculateTotalPoints(boulders, newSendAttempts, validatedBoulders);

      // Log the mutation parameters
      console.log('Calling updateAttemptMutation with:', {
        boulderId,
        type,
        attempts,
        userId: session?.user?.id,
        competitionId: currentCompetitionId
      });

      // Update in Supabase - wrap in try/catch for additional error handling
      try {
        updateAttemptMutation.mutate({ boulderId, type, attempts });
      } catch (mutationError) {
        console.error('Error in mutation call:', mutationError);
        throw mutationError;
      }

      toast({
        title: "Progress saved",
        description: attempts === 0
          ? `${type === 'send' ? 'Send' : 'Zone'} attempt removed`
          : `Recorded ${type} in ${attempts} ${attempts === 1 ? 'try' : 'tries'}`,
      });
    } catch (error) {
      console.error('Error in handleAttemptsChange:', error);
      toast({
        title: "Error saving attempt",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  // Calculate stats
  const totalSent = Object.values(sendAttempts).filter(a => a !== 'none').length;
  const totalFlashes = Object.values(sendAttempts).filter(a => a === '1').length;
  const completion = boulders.length > 0 ? Math.round((totalSent / boulders.length) * 100) : 0;

  // Show loading state if any data is loading
  if (loading || isLoadingBoulders || isLoadingAttempts) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isLoggedIn={!!session}
        userName={userName}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate('/');
          toast({
            title: "Logged out",
            description: "You have been logged out successfully",
          });
        }}
      />

      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('hi')}, {userName}!</h1>
            <p className="text-muted-foreground">{t('trackProgress')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('onlyBestSixBoulders')}
            </p>
          </div>

          <Button
            variant="outline"
            className="flex items-center gap-2 mt-4 md:mt-0"
            onClick={() => setShowScannerModal(true)}
          >
            <QrCode className="h-4 w-4" />
            {t('validate')}
          </Button>
        </div>

        {/* Scanner Modal */}
        {showScannerModal && (
          <ScannerModal
            isOpen={showScannerModal}
            onClose={() => setShowScannerModal(false)}
          />
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription>{t('totalPoints')}</CardDescription>
                <CardTitle className="text-3xl flex items-center">
                  {totalPoints}
                  <Trophy className="h-5 w-5 ml-2 text-amber-500" />
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription>{t('bouldersSent')}</CardDescription>
                <CardTitle className="text-3xl flex items-center">
                  {totalSent}/{boulders.length}
                  <span className="text-sm ml-2 mt-1 text-muted-foreground">({completion}%)</span>
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription>{t('flashes')}</CardDescription>
                <CardTitle className="text-3xl flex items-center">
                  {totalFlashes}
                  <CheckCircle2 className="h-5 w-5 ml-2 text-amber-500" />
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Zones card removed as zones are no longer counted in the score */}
        </div>

        <h2 className="text-2xl font-bold mb-6">{t('boulderProblems')}</h2>

        {/* Boulder Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boulders.map((boulder, index) => (
            <motion.div
              key={boulder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <BoulderCard
                boulder={boulder}
                sendAttempts={sendAttempts[boulder.id] || 'none'}
                onAttemptsChange={handleAttemptsChange}
                isBestBoulder={bestBoulderIds.includes(boulder.id)}
                isValidated={validatedBoulders[boulder.id] || false}
              />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
